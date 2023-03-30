let ws 
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
        name: 'A Line (Blue)',
        color: '#0072bc'
    },
    802: {
        name: 'B Line (Red)',
        color: '#e3131b'
    },
    803: {
        name: 'C Line (Green)',
        color: '#58a738'
    },
    804: {
        name: 'L Line (Gold)',
        color: '#fdb913'
    },
    805: {
        name: 'D Line (Purple)',
        color: '#a05da5'
    },
    806: {
        name: 'E Line (Expo)',
        color: '#5bc2e7'
    },
    807: {
        name: 'K Line (Crenshaw)',
        color: '#e96bb0'
    }
};



// fetch('https://api.metro.net/LACMTA/trip_shapes/')
//     .then(response => {
//         return response.json()
//     })
//     .then(response =>{
//         console.log(response)
//         response.forEach(element => {
//             // console.log(element.properties.shape_id)
//             let route_id = get_readable_route_id(element.properties.shape_id.substring(0,3))
//             console.log(route_id)
//             if (route_id == 'K Line (Crenshaw)'){
//                 let route_id_number = element.properties.shape_id.substring(0,3)
//                 L.geoJSON(element,
//                     {
//                         style: function(feature) {
                            
//                             return {color: colorDict[route_id_number],
//                             opacity: 0.5,weight: 5};
//                         }
//                     }).setZIndex(0).bindPopup(route_id).addTo(map);       
//             }
//         })
//     })
        
function get_readable_route_id(route_id){
    switch(route_id) {
        case '801': return 'A Line (Blue)';
        case '802': return 'B Line (Red)';
        case '803': return 'C Line (Green)';
        case '804': return 'L Line (Gold)';
        case '805': return 'D Line (Purple)';
        case '806': return 'E Line (Expo)';
        case '807': return 'K Line (Crenshaw)';
    }
}

let slideOptions = {
    duration: 1000,
    keepAtCenter: true
};

let all_rail_vehicles = L.layerGroup().addTo(map);

// to work on
const refreshTime = 5000; // in milliseconds
// const interval = setInterval(function() {
//     refreshMapData('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true')
//   }, refreshTime);
 

let initalLoad = false;
let geojson_layer_group = new L.LayerGroup().addTo(map);
// const socket = new WebSocket("ws://localhost/LACMTA/live/trip_detail/route_code/720?geojson=True");
let socket

// Connection opened
// socket.addEventListener("open", (event) => {
//   socket.send("Hello Server!");
// });
function pingWebsocketEveryFiveSeconds(){
    setInterval(function() {
        ping()
      }, refreshTime);
}

function tryPingingWebsocketWhilePageLoaded(){
    pingWebsocketEveryFiveSeconds()
}

// function repeatWhileWebsocketIsOpen(){
//     while (socket.readyState == WebSocket.OPEN){
//         console.log("pinging websocket")
//         pingWebsocketEveryFiveSeconds()
//     }
// }
function connectToWebsocket(route_code){
    if (socket != null) {
        socket.close()
    }
    socket = new WebSocket("wss://api.metro.net/LACMTA/live/trip_detail/route_code/" + route_code + "?geojson=True");

    socket.onopen = function(event) {
        console.log("Connected to websocket");
        console.log(event)
        updateMapBasedOnWebsocketData(event.data)
    }

    socket.addEventListener("open", (event) => {
        socket.send("Hello Server!");
      });

    socket.addEventListener("message", (event) => {
        socket.onmessage = function(event) {
            updateMapBasedOnWebsocketData(event.data)
        };
    });
    
}

function updateMapBasedOnWebsocketData(data){
    let websocketData;
    websocketData = JSON.parse(data);
    console.log(websocketData)
    showAndUpdateCount();
    if (websocketData.type == "FeatureCollection") {
        geojson_layer_group.clearLayers();
        // websocketData.features.forEach(feature => {
        //     feature.properties.color = colorDict[feature.properties.status]},
        //     onEachFeature = function(feature, layer) {
        //         layer.bindPopup(feature.properties.status);
        //     });
        
        geojson_layer_group.addLayer(L.geoJson(websocketData, {
            pointToLayer: function(feature, latlng) {
                if (feature.properties.trip_assigned == true){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            },
            onEachFeature: onEachFeature
        }));
        geojson_layer_group.addTo(map);
    } else {
        console.error("Got something other than a geojson feature");
    };

    pong();

}


let route_code = 720
function init(){
    connectToWebsocket(route_code)
    tryPingingWebsocketWhilePageLoaded()
}

const statusColorDict= {
    "IN_TRANSIT_TO": "#0072bc",
    "STOPPED_AT": "#e3131b"
}

let tm;
function ping() {
    socket.send('__ping__');
    tm = setTimeout(function () {

       /// ---connection closed ///


}, 5000);
}

function pong() {
    clearTimeout(tm);
}



// Listen for messages


function onEachFeature(feature, layer) {
    layer.on({
      // TODO: will add highlight and unhighlight events later when I have time
      click: layer.bindPopup("<h3>Destination:<br>"+feature.properties.trip.destination_code+"</h3> Status: "+feature.properties.current_status+"<br> Stop Name: "+feature.properties.stop_name+"<br>")
    });
  }

// window.addEventListener("load", (event) => {


//     // ws = new WebSocket('wss://api.metro.net/LACMTA/live/trip_detail/route_code/720?geojson=True');
//     // ws.onopen = function() {
//     //     console.log("Opened");
//     // };
//     // ws.onclose = function() {
//     //     console.log("Closed");
//     // };

// });
  

// function refreshMapData(url){
//     fetchDataFromApi(url);
// }

// function getTripDetails(url){
//     console.log(url)
//     let tripDetails = {};
//     fetch(url)
//         .then(response => {
//             return response.json();
//             }
//         )
//         .then(response =>{
//             tripDetails = response;
//         })
//     return tripDetails;
// }



// to remove

// realtime1 = createRealtimeLayer('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true').addTo(map);

let metro_basemap = L.tileLayer('https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Raster_tile_Map/MapServer?f=html&cacheKey=82b4049fd59cbc4c/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map);

let Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map);
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

// function onEachFeature(feature, layer) {
//     // does this feature have a property named popupContent?
//     console.log(feature)
//         for (const point in feature) {

//             if (feature.hasOwnProperty(point)) {
        
//                 const element = feature[point];
//                 element.slideTo(element.geometry.coordinates, slideOptions)
//             }
//         }
// }

L.esri
.tiledMapLayer({
  url: "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Raster_tile_Map/MapServer?cacheKey=82b4049fd59cbc4c",
  pane: "overlayPane"
})
.addTo(map);

// L.esri.Vector.vectorTileLayer(
//     "https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Hybrid_Vector_tile_Map/VectorTileServer"

//     ).addTo(map);
// var overlays = {
//     "Cities": cities
// };
let updateCount = 0;
function showAndUpdateCount() {
    updateCount++;
    document.getElementById('updateCount').innerHTML = "Total Updates: "+updateCount + "<br>Last at " + new Date().toLocaleTimeString();
}
L.Control.Legend = L.Control.extend({
    onAdd: function(map) {
      var el = L.DomUtil.create('div', 'leaflet-control-layers-expanded legend');
  
      el.innerHTML = "<div id='updateCount'>Loading updates<br>...</div><svg height='10' width='10'><circle cx='5' cy='5' r='4' stroke='black' stroke-width='1' fill='orange' /></svg>"+route_code+" Vehicles";
  
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



L.Control.Form = L.Control.extend({
    onAdd: function(map) {
        let div = L.DomUtil.create('div');
        div.innerHTML = "<form><input type='text' id='route_code' name='route_code' placeholder='Route Code'><input type='submit' value='Submit'></form>"
        return div;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.form = function(opts) {
    return new L.Control.Form(opts);
}

L.control.form({ position: 'topright' }).addTo(map);

init();