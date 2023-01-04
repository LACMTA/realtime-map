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
    realtime1 = createRealtimeLayer('https://api.metro.net/LACMTA_Rail/vehicle_positions/all?geojson=true').addTo(map);

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
