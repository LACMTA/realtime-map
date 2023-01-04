// let vehicle_id_endpoint = 'http://localhost/LACMTA/vehicle_positions'
let vehicle_id_endpoint = 'http://localhost/LACMTA_Rail/vehicle_positions/all'


let map = L.map('map'),
trail = {
    type: 'Feature',
    properties: {
        id: 1
    },
    geometry: {
        type: 'Point',
        coordinates: []
    }
},
realtime = L.realtime(function(success, error) {
    fetch(vehicle_id_endpoint)
    .then(function(response) { return response.json(); })
    .then(function(data) {
        data.forEach(element => {
        var trailCoords = trail.geometry.coordinates;
        trailCoords.push(element.geometry.coordinates);
        trailCoords.splice(0, Math.max(0, trailCoords.length - 5));
        });
        console.log(data)
        success({
            type: 'Feature',
            features: [data, trail]
        });
    })
    .catch(error);
}, {
    interval: 50000
}).addTo(map)
map.setView([34.1709, -118.444], 8);

// var tiles = L.tileLayer('https://albertkun.github.io/testRingSomeTiles/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// }).addTo(map);
// declare variables
let mapOptions = {'center': [34.0709,-118.444],'zoom':5}

// use the variables
// const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

// let ApiURL = 'https://dev-metro-api-v2.ofhq3vd1r7une.us-west-2.cs.amazonlightsail.com/LACMTA/vehicle_positions/vehicle_id/5816'
// let baseAPIurl = 'http://localhost/LACMTA/vehicle_positions/vehicle_id/list'
// let vehicle_id_endpoint = 'http://localhost/LACMTA/shapes'
// let vehicle_id_endpoint = 'http://localhost/LACMTA_Rail/vehicle_positions'
// let vehicle_id_endpoint = 'http://localhost/LACMTA/vehicle_positions'
// let vehicle_id_endpoint = 'http://localhost/LACMTA/vehicle_positions_no_cache'
// let vehicle_id_endpoint = 'http://localhost/LACMTA_Rail/shapes'

let Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map);





// create a function to add markers
function addMarker(lat,lng,title,message){
console.log(message)
L.marker([lat,lng]).addTo(map).bindPopup(`<h2>${title}</h2> <h3>${message}</h3>`)
return message
}
let old_features = L.featureGroup();
let new_features = L.featureGroup();
// const interval = setInterval(function() {
//     old_features = new_features;
//     new_features = new L.featureGroup();
//     fetch(vehicle_id_endpoint+'/all')
//     .then(response => {
//         console.log(response)
//         return response.json()
//     })
//     .then(response =>{
//         response.forEach(element => {
//             let current_map_layer = placeOnMap(element)
//         })
//         old_features.clearLayers();
//         new_features.addTo(map);
//     })
//   }, 5000);


// new_features = new L.Realtime();
// fetch(vehicle_id_endpoint+'/all')
// .then(response => {
//     console.log(response)
//     return response.json()
// })
// .then(response =>{
//     response.forEach(element => {
//         let current_map_layer = placeOnMap(element)
//     })
//     new_features.addTo(map);
// })



// placeOnMap('21120_SEPT22')
var geojsonMarkerOptions = {
    radius: 2,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};
function placeOnMap(element){
    let this_geojson = L.geoJSON(element.geometry, {
        pointToLayer: (feature, latlng) => { 
            return L.circleMarker(latlng, geojsonMarkerOptions)
        }
    })
    new_features.addLayer(this_geojson)

    // fetch(vehicle_id_endpoint+'/'+element)
    // .then(response => {
    //     return response.json()
    // })
    // .then(data =>{
    //     // Basic Leaflet method to add GeoJSON data        
    //     let this_geojson = L.geoJSON(data[0].geometry, {
    //             pointToLayer: (feature, latlng) => { 
    //                 return L.circleMarker(latlng, geojsonMarkerOptions)
    //             }
    //         }).bindPopup(layer => {
    //             return layer.shape_pt_sequence;
    //         }).addTo(map);
    // })
}
// Basic Leaflet method to add GeoJSON data



// var map = L.map('map')
// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

realtime.on('update', function() {
    map.fitBounds(realtime.getBounds(), {maxZoom: 3});
});
