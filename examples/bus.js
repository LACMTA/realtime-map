var geojsonMarkerOptions = {
    radius: 2,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    zIndex: -1
};



const colorArray = ["red","#f7a35c","purple","#5bc2e7","pink","#ff0066","#eeaaee","#55BF3B","#DF5353","#7798BF","#aaeeee"];
const colorDict= {
    801: "#0072bc",
    802: "#e3131b",
    803: "#58a738",
    804: "#fdb913",
    805: "#a05da5",
    806: "#5bc2e7",
    807: "#e96bb0",
}

function get_readable_route_id(route_id){
    switch(route_id) {
        case '801': return 'A Line (Blue)';
        case '802': return 'B Line (Red)';
        case '803': return 'Expo Line';
        case '804': return 'L Line (Gold)';
        case '805': return 'D Line (Purple)';
        case '806': return 'E Line (Expo)';
        case '807': return 'K Line';
    }
}

fetch('https://api.metro.net/LACMTA_Rail/trip_shapes/all')
.then(response => {
    return response.json()
})

.then(response =>{
    console.log(response)
    response.forEach(element => {
        console.log(element.properties.shape_id)
        // let route_id = element.properties.shape_id.substring(0,3)
        let route_id = get_readable_route_id(element.properties.shape_id.substring(0,3))
        let route_id_number = element.properties.shape_id.substring(0,3)
        L.geoJSON(element,
            {
                style: function(feature) {
                    
                    return {color: colorDict[route_id_number],
                    opacity: 0.5,}

                }
            }).setZIndex(0).bindPopup(route_id).addTo(map);
    })


    // L.geoJSON(response,
    //     {
    //         style: function(feature) {
    //             switch(feature.properties.shape_id) {
    //                 case '1': return {color: colorArray[0]};
    //                 case '2': return {color: colorArray[1]};
    //                 case '3': return {color: colorArray[2]};
    //                 case '4': return {color: colorArray[3]};
    //                 case '5': return {color: colorArray[4]};
    //                 case '6': return {color: colorArray[5]};
    //                 case '7': return {color: colorArray[6]};
    //             }
    //         }
    //     }).addTo(map);
    
    // old_features.clearLayers();
    // new_features.addTo(map);
    })


function createRealtimeLayer(url) {
    return L.realtime(url, {
        interval: 10 * 1000,
        getFeatureId: function(f) {
            // console.log(f)
            return f.properties.vehicle.vehicle_id;
        },
        pointToLayer: (f, latlng) => { 
            return L.circleMarker(latlng, geojsonMarkerOptions)
        },
        cache: true,
        onEachFeature(f, l) {
            l.bindPopup(function() {
                return '<h3>' + f.properties.trip.route_id+'</h3>';
            });
        }
    });
}



var map = L.map('map'),
    // clusterGroup = L.markerClusterGroup().addTo(map),
    // subgroup1 = L.featureGroup.subGroup(clusterGroup),
    // subgroup2 = L.featureGroup.subGroup(clusterGroup),
    realtime1 = createRealtimeLayer('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true').addTo(map);
    // realtime2 = createRealtimeLayer('http://localhost/LACMTA_Rail/trip_shapes/all').addTo(map)
    // map.fitBounds(realtime1.getBounds());
    // realtime2 = createRealtimeLayer('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', subgroup2);


// fetch('http://localhost/LACMTA_Rail/vehicle_positions/all')
// .then(response => {
//     console.log(response)
//     return response.json()
// })
// .then(response =>{
//     response.forEach(element => {
//         let current_map_layer = placeOnMap(element)
//     })
//     old_features.clearLayers();
//     new_features.addTo(map);
// })

map.locate({setView: true, maxZoom: 16});

function onLocationFound(e) {
    let radius = e.accuracy;
    let current_location_marker_options = {
        radius: 5,
        fillColor: "#007800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8

    }

    L.circle(e.latlng, radius).addTo(map);
    L.circleMarker(e.latlng, current_location_marker_options).addTo(map)
    .bindPopup("You are within " + radius + " meters from this point").openPopup();
}

map.on('locationfound', onLocationFound);

// fetch('https://api.metro.net/LACMTA/trip_shapes/all')
// .then(response => {
//     console.log(response)
//     return response.json()
// })
// .then(response =>{
//     response.forEach(element => {
//         L.geoJSON(element)
//     }).addTo(map)
//     // old_features.clearLayers();
//     // new_features.addTo(map);
// })


let Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map);

map.setView([34.1709, -118.444], 8);

L.control.layers(null, {
    'Rail': realtime1
}).addTo(map);

realtime1.once('update', function() {
    console.log('realtime1 loaded');
    // map.fitBounds(realtime1.getBounds());
});
