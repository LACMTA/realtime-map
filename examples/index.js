let geojsonMarkerOptions = {
    radius: 5,
    fillColor: "#dd6d03",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    zIndex: -1
};

let markerOptions = {
    iconUrl: 'rail-icon.png',
    iconSize: [32, 32],
    zIndex: -1
};

let railIcon = L.icon({
    iconUrl: 'rail-icon.png',
    iconSize: [16, 16],
    zIndex: -1
});

let stopIcon = L.icon({
    iconUrl: 'stop-icon.svg',
    iconSize: [10, 10],
    zIndex: -2
});

let map = L.map('map', {
    minZoom: 10,
    maxZoom: 16
});
    
const colorDict= {
    801: "#0072bc",
    802: "#e3131b",
    803: "#58a738",
    804: "#fdb913",
    805: "#a05da5",
    806: "#5bc2e7",
    807: "#e96bb0",
}

const railLinesDict = {
    801: {
        name: 'A Line',
        color: '#0072bc'
    },
    802: {
        name: 'B Line',
        color: '#e3131b'
    },
    803: {
        name: 'C Line',
        color: '#58a738'
    },
    804: {
        name: 'E Line',
        color: '#fdb913'
    },
    805: {
        name: 'D Line',
        color: '#a05da5'
    },
    807: {
        name: 'K Line',
        color: '#e96bb0'
    }
};

let shapes801 = [];
let shapes802 = [];
let shapes803 = [];
let shapes804 = [];
let shapes805 = [];
let shapes807 = [];

window.railShapes.forEach(shape => {
    if (shape["shape_id"].startsWith('801')) {
        shapes801.push([
            shape["shape_pt_lat"],
            shape["shape_pt_lon"]
        ]);
    }
    if (shape["shape_id"].startsWith('802')) {
        shapes802.push([
            shape["shape_pt_lat"],
            shape["shape_pt_lon"]
        ]);
    }
    if (shape["shape_id"].startsWith('803')) {
        shapes803.push([
            shape["shape_pt_lat"],
            shape["shape_pt_lon"]
        ]);
    }
    if (shape["shape_id"].startsWith('804')) {
        shapes804.push([
            shape["shape_pt_lat"],
            shape["shape_pt_lon"]
        ]);
    }
    if (shape["shape_id"].startsWith('805')) {
        shapes805.push([
            shape["shape_pt_lat"],
            shape["shape_pt_lon"]
        ]);
    }
    if (shape["shape_id"].startsWith('807')) {
        shapes807.push([
            shape["shape_pt_lat"],
            shape["shape_pt_lon"]
        ]);
    }
})

L.polyline(shapes801, {color: colorDict[801]}).addTo(map);
L.polyline(shapes802, {color: colorDict[802]}).addTo(map);
L.polyline(shapes803, {color: colorDict[803]}).addTo(map);
L.polyline(shapes804, {color: colorDict[804]}).addTo(map);
L.polyline(shapes805, {color: colorDict[805]}).addTo(map);
L.polyline(shapes807, {color: colorDict[807]}).addTo(map);

window.railStops.forEach(stop => {
    if (stop["tpis_name"]) {
        console.log(stop["tpis_name"])
        L.marker([stop["stop_lat"], stop["stop_lon"]], { icon: stopIcon }).addTo(map).bindPopup('<b>' + stop["stop_name"] + '</b><br>' + stop["stop_id"]);
    }
})
        
function get_readable_route_id(route_id){
    switch(route_id) {
        case '801': return 'A Line';
        case '802': return 'B Line';
        case '803': return 'C Line';
        case '804': return 'E Line';
        case '805': return 'D Line';
        case '807': return 'K Line';
    }
}

let slideOptions = {
    duration: 1000,
    keepAtCenter: true
};

let all_rail_vehicles = L.layerGroup().addTo(map);

// to work on
const refreshTime = 5000; // in milliseconds
const interval = setInterval(function() {
    refreshMapData('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true')
  }, refreshTime);
 
// onload:
// - create featureGroup layers for each rail line
// - then loop through API response and add each vehicle to the correct layer.

// set interval for:
// 
// 3 cases to handle:
//   1. New data includes bus currently on map. DONE!
//   2. New data includes bus NOT currently on map.
//   3. New data DOES NOT include bus currently on map.
// 
// With each API call, loop through each vehicle returned, then 
// check if that vehicle has a marker on the map: 
// - If a marker exists: update the position of that marker and add the vehicle. (1)
// - If a marker does not exist: create a new marker and add it to the map. (2)
//
// Loop through all markers on the map and check if the vehicle exists in the API call:
// - If a vehicle from the map DOES NOT exist in the API, remove it from the map. (3)


let initalLoad = false;

window.addEventListener("load", (event) => {
    createRailFeatureGroups(map);
    fetchDataFromApi('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true');
});
  
function refreshMapData(url){

    fetchDataFromApi(url);
}
function getTripDetails(url){
    console.log(url)
    let tripDetails = {};
    fetch(url)
        .then(response => {
            return response.json();
            }
        )
        .then(response =>{
            tripDetails = response;
        })
    return tripDetails;
}


function fetchDataFromApi(url){
    fetch(url)
        .then(response => {
            return response.json();
            })
        .then(response =>{
            // for debugging
            if (initalLoad == false){
                initalLoad = true;

                console.log('initial load');
                let count = 0
                response.features.forEach(element => {
                    // Add each element to the appropriate FeatureGroup
                    if (element.properties.trip.hasOwnProperty('route_id')) {
                        if (count == 0) {
                            document.getElementById('updateTime').innerHTML = "Updated at: " + new Date().toLocaleTimeString();
                            count++;
                        }
                        let route = element.properties.trip.route_id;
                        let fgroup = railLinesDict[route].layer;
                        L.marker([element.geometry.coordinates[1], element.geometry.coordinates[0]], 
                            {
                                icon: railIcon,
                                vehicle_id: element.properties.vehicle.vehicle_id
                            })
                        .bindPopup('<b>' + get_readable_route_id(element.properties.trip["route_id"]) + '</b><br>' + element.properties.vehicle["vehicle_id"])
                        .addTo(fgroup);
                        console.log(element.properties)
                    } else {
                        // No trip/route assigned
                    }
                    
                });
            } else {
                console.log('repeated load');
                document.getElementById('updateTime').innerHTML = "Updated at: " + new Date().toLocaleTimeString();
                // if vehicles already exist on map, update their coordinates
                response.features.forEach(element => {
                    if (element.properties.trip.hasOwnProperty('route_id')) {
                        let route = element.properties.trip.route_id;
                        let featureGroup = railLinesDict[route].layer;

                        let noMarkersYet = [];

                        featureGroup.eachLayer(function(feature) {
                            // updates Marker position if it exists on the map
                            if (feature.options.vehicle_id == element.properties.vehicle.vehicle_id) {
                                // console.log('vehicle match found: ' + feature.options.vehicle_id);
                                var newLatLng = new L.LatLng(element.geometry.coordinates[1], element.geometry.coordinates[0]);
                                feature.setLatLng(newLatLng); 
                            }
                            // first case is working, but second case is not..
                            // stopped above, but map is updating in real-time!!
                        });
                    }
                });
            }

            // create markers based on vehicles
            // response.features.forEach(element => {
            //     let vehicle_id = element.properties.vehicle.vehicle_id;
            // });
        });
    }


function createRailFeatureGroups(map) {
    for (const [key, value] of Object.entries(railLinesDict)) {
        let featureGroup = L.featureGroup();
        featureGroup.id = key.toString();
        railLinesDict[key].layer = featureGroup;
        featureGroup.addTo(map);
        console.log(`${key} added`);
    }
    return;
}



// to remove

// realtime1 = createRealtimeLayer('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true').addTo(map);

// let metro_basemap = L.tileLayer('https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Raster_tile_Map/MapServer?f=html&cacheKey=82b4049fd59cbc4c/tile/{z}/{y}/{x}', {
//     attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
//     maxZoom: 16
// }).addTo(map);

// let Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
//     attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
//     maxZoom: 16
// }).addTo(map);
map.locate({setView: true, maxZoom: 16});

// let wmsOptions = {
//     layers: 'rail_stations (Union station/Gold),rail_stations,Metro Stations'
// }

let metro_arcgis_basemap = "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Raster_tile_Map/MapServer/WMTS/1.0.0/WMTSCapabilities.xml?cacheKey=82b4049fd59cbc4c"
let wmsLayer = L.tileLayer(metro_arcgis_basemap).addTo(map);

function onLocationFound(e) {
    let radius = e.accuracy;
    let current_location_marker_options = {
        radius: 5,
        fillColor: "#007800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.5

    };

    L.circle(e.latlng, radius).addTo(map);
    L.circleMarker(e.latlng, current_location_marker_options).addTo(map)
    .bindPopup("You are within " + radius + " meters from this point").openPopup();
}

map.on('locationfound', onLocationFound);



map.setView([33.9709, -118.444], 10);
map.setMaxBounds(map.getBounds().pad(0.2));

// L.control.layers(null, {
//     : all_rail_vehicles
// },{collapsed: false}).addTo(map);

function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    console.log(feature)
        for (const point in feature) {

            if (feature.hasOwnProperty(point)) {
        
                const element = feature[point];
                element.slideTo(element.geometry.coordinates, slideOptions)
            }
        }
}

// L.esri
// .tiledMapLayer({
//   url: "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Raster_tile_Map/MapServer?cacheKey=82b4049fd59cbc4c",
//   pane: "overlayPane"
// })
// .addTo(map);


// L.esri.Vector.vectorTileLayer(
//     "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Vector_tile_Map/VectorTileServer/"
//   ).addTo(map);

// L.esri.Vector.vectorTileLayer(
//     "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Vector_tile_Map/VectorTileServer"

//     ).addTo(map);
// var overlays = {
//     "Cities": cities
// };


L.Control.Legend = L.Control.extend({
    onAdd: function(map) {
      var el = L.DomUtil.create('div', 'leaflet-control-layers-expanded legend');
  
      el.innerHTML = "<img src='rail-icon.png' style='max-width:16px'><img> Current Rail Vehicles<br><div id='updateTime'></div>";
  
      return el;
    },
  
    onRemove: function(map) {
      // Nothing to do here
    }
  });
  
  L.control.legend = function(options) {
    return new L.Control.Legend(options);
  }
  
  L.control.legend({
    position: 'topright'
  }).addTo(map);




const esriTilesUrl = "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Vector_tile_Map/VectorTileServer/tile/{z}/{y}/{x}.pbf?cacheKey=82b4049fd59cbc4c";

const url = "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Vector_tile_Map/VectorTileServer/resources/styles/root.json";

const prepareStyle = async () => {
  // object to store layer descriptions
  const vectorTileLayerStyles = {};

  // get the actual JSON style file from the ArcGIS REST endpoint
  const { data } = await axios.get(url);

  // loop over the layers property specifically for the JSON style
  data.layers.forEach(layer => {
    // only work with layers that are 'type === line', in this case.
    // Modify as needed, but ArcGIS Vector labels do not work for me in the current version
    const layerName = layer["source-layer"];
    if (layer.type === "line") {
      // add layer to style placeholder using layer name property
      vectorTileLayerStyles[layerName] = {
        weight: layerName === "TaxParcels" ? .1 : .5, // dynamic weight assignment
        color: layer.paint["line-color"],
        opacity: 1
      };
    } else {
      // if the layer type is not a line, make the layer transparent
      vectorTileLayerStyles[layerName] = {
        opacity: 0
      };
    }
  });

  return vectorTileLayerStyles;
};

const friendlyStyleObject = await prepareStyle();

// friendlyStyleObject can be used in the constructor options for VectorGrid

// console.log(friendlyStyleObject['TaxParcels']);

/*
  Expected console.log output:
  {
    weight: 2, 
    color: "rgba(207,198,165,0.9)", 
    opacity: 1
  }
*/
let esriVectorTileOptions = {
    rendererFactory: L.canvas.tile,
    attribution: '© ESRI',
    vectorTileLayerStyles: friendlyStyleObject,
};

let  esriTilesPbfLayer = L.vectorGrid.protobuf(esriTilesUrl, esriVectorTileOptions);
esriTilesPbfLayer.addTo(map);