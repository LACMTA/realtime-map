    const ESRI_KEY =  "AAPKccc2cf38fecc47649e91529acf524abflSSkRTjWwH0AYmZi8jaRo-wdpcTf6z67CLCkOjVYlw3pZyUIF_Y4KGBndq35Y02z";
    const MAPTILER_KEY = "KydZlIiVFdYDFFfQ4QYq"
    const basemapEnum = "65aff2873118478482ec3dec199e9058";
    let timer = setTimeout(() => {
    document.getElementById('loading').innerHTML = "Sorry, loading timed out: we're currently unable to load data. Please check your connection or try again later.";
}, 25000); // 25 seconds

let features = [];
// Declare a global variable to store the route shapes data
let routeShapesData;

// Create a map of vehicle IDs to markers
let markers = {};

// Get the current time
const now = new Date();

// Convert the current time to PST
let pst = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));

// Get the current hour in PST
let hour = pst.getHours();

// map setup

let map = new maplibregl.Map({
    container: 'map',
    center: [-118.25133692966446, 34.05295151499077], 
    zoom: 9,
    pitch: 20,
    bearing: 0,
    container: 'map',
    antialias: true,
    minZoom: 8, // Minimum zoom level
    style: `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/items/${basemapEnum}?token=${ESRI_KEY}`,
});

const routeIcons = {
    '801': 'https://lacmta.github.io/metro-iconography/Service_ALine.svg',
    '802': 'https://lacmta.github.io/metro-iconography/Service_BLine.svg',
    '803': 'https://lacmta.github.io/metro-iconography/Service_CLine.svg',
    '804': 'https://lacmta.github.io/metro-iconography/Service_ELine2.svg',
    '806': 'https://lacmta.github.io/metro-iconography/Service_LLine.svg',
    '807': 'https://lacmta.github.io/metro-iconography/Service_KLine.svg',
    '805': 'https://lacmta.github.io/metro-iconography/Service_DLine.svg',
    '901': 'https://lacmta.github.io/metro-iconography/Service_GLine.svg',
    '910': 'https://lacmta.github.io/metro-iconography/Service_JLine.svg'    
};

    
    // The 'building' layer in the streets vector source contains building-height
    // data from OpenStreetMap.
    map.on('load', () => {
        // Insert the layer beneath any symbol layer.
        const layers = map.getStyle().layers;

        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }
        new mapboxglEsriSources.TiledMapService('imagery-source', map, {
        url: 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC5/MapServer'
    })

    map.addLayer({
        id: 'imagery-layer',
        type: 'raster',
        source: 'imagery-source'
    })
    let apiUrl = `https://api.metro.net/LACMTA_Rail/vehicle_positions?format=geojson&nocache=${new Date().getTime()}`;

// Declare and initialize the popups object
let popups = {};
let brtUrl = 'https://api.metro.net/LACMTA/vehicle_positions/route_code/901%2C910?format=geojson'


// Extract the fetch logic into a separate function

function handleError(error) {
    if (error instanceof TypeError) {
        document.getElementById('loading').innerHTML = "We're experiencing technical difficulties with our data. We're attempting to reload the data. Please wait<span class='dot1'>.</span><span class='dot2'>.</span><span class='dot3'>.</span>";
        console.error('TypeError caught: ', error);
        // Retry loading data
        fetchData();
    } else if (error instanceof SyntaxError) {
        document.getElementById('loading').innerHTML = "We're currently facing some technical issues. Our team is working on it. Please try again later.";
    } else if (error instanceof ReferenceError) {
        document.getElementById('loading').innerHTML = "We're unable to find some necessary information. Please try again later.";
    } else {
        document.getElementById('loading').innerHTML = `We're experiencing unexpected issues: ${error.message}. Our team is looking into it. Please try again later.`;
    }
}


// Define a function to hide the loading div
function hideLoadingDiv() {
    document.getElementById('loading').style.display = 'none';
}
const updateTimeDivDom = document.getElementById('update-time');
// Add an event listener to the update time div



    map.addSource('openmaptiles', {
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
        type: 'vector',
    });
    map.addSource('vehicles', {
        type: 'geojson',
        data: apiUrl,
    });

        map.addLayer(
            {
                'id': '3d-buildings',
                'source': 'openmaptiles',
                'source-layer': 'building',
                'type': 'fill-extrusion',
                'minzoom': 14,
                'paint': {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'render_height'],0, 'lightgray', 200, 'hsl(38, 28%, 77%)', 400, 'hsl(38, 28%, 77%)'
                    ],
                    'fill-extrusion-opacity': 0.5,
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        16,
                        ['get', 'render_height']
                    ],
                    'fill-extrusion-base': ['case',
                        ['>=', ['get', 'zoom'], 16],
                        ['get', 'render_min_height'], 0
                    ]
                }
            },
            labelLayerId
        );

    });

    // Add navigation controls to the top-left corner of the map
map.addControl(new maplibregl.NavigationControl(), 'top-left');


class VehicleMarker extends maplibregl.Marker {
    constructor(options, id) {
        super(options);
        this.id = id;
    }
}

// Create a home button
class HomeControl {
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl';
        const button = document.createElement('button');
        button.className = 'maplibregl-ctrl-icon home-icon'; // Add 'home-icon' class
        button.innerHTML = '<i class="fas fa-home"></i>';
        button.addEventListener('click', () => {
            this.map.flyTo({
                center: [-118.25133692966446, 34.05295151499077],
                zoom: 9,
                pitch: 20,
                bearing: 0
            });
        });
        this.container.appendChild(button);
        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

window.onload = function() {
    const legend = document.getElementById('legend');
    const toggleLegend = document.getElementById('toggle-legend');

    if (legend && toggleLegend) {
        legend.addEventListener('click', function() {
            this.classList.toggle('hidden');

            // Change the icon based on the visibility
            toggleLegend.innerHTML = this.classList.contains('hidden') ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-chevron-left"></i>';
        });
    } else {
        console.error('Element not found');
    }
};

let lastProcessedTime = 0;
const throttleInterval = 5000; // Adjust this value to change the throttle time

// Handle the connection opening
// Handle incoming messages

let animations = {};
let isAnimating = false;
let pendingData = null;

function animateMarker(vehicle, diffLng, diffLat, steps, currentCoordinates) {
    return new Promise(resolve => {
        let i = 0;
        function animate() {
            if (i <= steps) {
                let progress = i / steps;
                let easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                markers[vehicle.properties.vehicle_id].setLngLat([
                    currentCoordinates.lng + easedProgress * diffLng,
                    currentCoordinates.lat + easedProgress * diffLat
                ]);

                // Update the rotation of the marker
                if (vehicle.properties && vehicle.properties.position_bearing) {
                    markers[vehicle.properties.vehicle_id].setRotation(vehicle.properties.position_bearing);
                }

                i++;
                animations[vehicle.properties.vehicle_id] = requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        animate();
    });
}

function processAndUpdate(data) {
    let allVehicles = data.entity.filter(vehicle => vehicle.vehicle && vehicle.vehicle.trip);
    let geojson = {
        type: "FeatureCollection",
        features: allVehicles.map(vehicle => ({
            type: "Feature",
            properties: {
                id: vehicle.vehicle.vehicle.id,
                vehicle_id: vehicle.vehicle.vehicle.id,
                currentStatus: vehicle.vehicle.currentStatus,
                currentStopSequence: vehicle.vehicle.currentStopSequence,
                stopId: vehicle.vehicle.stopId,
                timestamp: parseInt(vehicle.vehicle.timestamp),
                route_code: vehicle.vehicle.trip.routeId,
                trip: vehicle.vehicle.trip,
                trip_id: vehicle.vehicle.trip.tripId,
                position_bearing: vehicle.vehicle.position.bearing,
                position_speed: vehicle.vehicle.position.speed,
                position_latitude: vehicle.vehicle.position.latitude,
                position_longitude: vehicle.vehicle.position.longitude

            },
            geometry: {
                type: "Point",
                coordinates: [vehicle.vehicle.position.longitude, vehicle.vehicle.position.latitude]
            }
        }))
    };
    const features = getFeaturesFromData(geojson);
    let newVehicleIds = new Set(geojson.features.map(vehicle => vehicle.properties.vehicle_id));
    let this_data = {features}
    // removeOldMarkers(newVehicleIds, this_data);
    processVehicleData(this_data, features);
    updateMap(features);
    updateUI();

    // Get the current time
    const now = new Date();

    // Get the update time div
    const updateTimeDiv = document.getElementById('update-time');

    // Update the content of the update time div
    updateTimeDiv.textContent = `Updated at ${now.toLocaleTimeString()}`;
    updateTimeDiv.style.fontSize = '12px';

    // Start the animation
    isAnimating = true;
    animateMarker().then(() => {
        isAnimating = false;

        // If new data has arrived while the animation was running, process it now
        if (pendingData) {
            processAndUpdate(pendingData);
            pendingData = null;
        }
    });
}
function setupWebSocket() {
    let socket = new WebSocket("wss://dev-metro-api-v2.ofhq3vd1r7une.us-west-2.cs.amazonlightsail.com/ws/LACMTA_Rail/vehicle_positions");

    socket.onopen = function(event) {
        console.log("WebSocket connection opened");
        setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send('ping');
                // console.log('Sent ping'); // for debugging purposes
            }
        }, 30000);
    };

    socket.onerror = function(error) {
        console.error(error);
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loading').innerHTML = "Error loading data. Please check your connection or try again later.";
    };

    // Handle errors
    socket.onerror = function(error) {
        console.log(`WebSocket error: ${error}`);
    };

    // Handle the connection closing
    socket.onclose = function(event) {
        console.log("WebSocket connection closed");
        // Try to reconnect after a delay
        setTimeout(setupWebSocket, 5000); // 5000 ms delay before reconnecting
    };

    socket.onmessage = function(event) {
        const currentTime = Date.now();
        lastUpdateTime = currentTime;

        // Process the update
        const data = JSON.parse(event.data);

        // If an animation is currently running, store the data and wait for the animation to complete
        if (isAnimating) {
            pendingData = data;
        } else {
            processAndUpdate(data);
        }
    };
}

map.on('load', function() {
    // Set up the WebSocket connection and the onmessage event handler here
    setupWebSocket();
});

function updateMap(features) {
    map.getSource('vehicles').setData({
        type: 'FeatureCollection',
        features: features
    });
}

function getFeaturesFromData(data) {
    let features;
    if (data && data.features) {
        features = Array.isArray(data.features) ? data.features : Object.values(data.features);
    } else if (data && Object.keys(data).length > 0) {
        const routeData = data[Object.keys(data)[0]];
        if (routeData && routeData.features) {
            features = Array.isArray(routeData.features) ? routeData.features : Object.values(routeData.features);
        }
    }

    if (!features) {
        throw new Error('The API response does not have a features property');
    }

    // Filter out data that does not have valid latitude and longitude values
    features = features.filter(feature => {
        const coordinates = feature.geometry.coordinates;
        return Array.isArray(coordinates) && coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1]);
    });

    return features;
}
function updateUI() {
    const now = new Date();
    const updateTimeDiv = document.getElementById('update-time');
    updateTimeDiv.textContent = `Updated at ${now.toLocaleTimeString()}`;
    updateTimeDiv.style.fontSize = '12px';

    let pst = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    let hour = pst.getHours();

    if (Object.keys(markers).length > 1) {
        hideLoadingDiv();
    }
}
function hideLoadingDiv() {
    document.getElementById('loading').style.display = 'none';
}

function removeOldMarkers(newVehicleIds, data) {
    if (data.features.length > 0) {
        for (let vehicle_id in markers) {
            if (!newVehicleIds.has(vehicle_id)) {
                markers[vehicle_id].remove();
                delete markers[vehicle_id];
            }
        }
    }
}

function processVehicleData(data, features) {
    data.features.filter(vehicle => vehicle.properties && vehicle.properties.trip_id).forEach(vehicle => {
        if (markers[vehicle.properties.vehicle_id]) {
            // Check if the new timestamp is newer than the current marker's timestamp
            if (parseInt(vehicle.properties.timestamp) > parseInt(markers[vehicle.properties.vehicle_id].timestamp)){
                // Update the marker's timestamp
                markers[vehicle.properties.vehicle_id].timestamp = parseInt(vehicle.properties.timestamp);
                // Update the marker's position
                updateExistingMarker(vehicle);
            }
        } else {
            createNewMarker(vehicle, features);
        }
    });
}


// Run every 5 minutes
setInterval(() => {
    const now = Date.now();
    const retentionPeriod = 5 * 60 * 1000; // 5 minutes

    // Remove old entries from the features array
    features = features.filter(feature => now - feature.timestamp <= retentionPeriod);

    // Remove old entries from the markers object
    for (const [vehicleId, marker] of Object.entries(markers)) {
        if (now - marker.timestamp > retentionPeriod) {
            delete markers[vehicleId];
        }
    }
}, 5 * 60 * 1000);

let arrowSvg;

function updateExistingMarker(vehicle) {
    let currentCoordinates = markers[vehicle.properties.vehicle_id].getLngLat();
    updateMarkerRotations();
    if (vehicle.geometry && vehicle.geometry.coordinates) {
        let diffLng = vehicle.geometry.coordinates[0] - currentCoordinates.lng;
        let diffLat = vehicle.geometry.coordinates[1] - currentCoordinates.lat;
        let distance = Math.sqrt(diffLng * diffLng + diffLat * diffLat);

        // Convert the distance from degrees to miles
        let distanceInMiles = distance * 69;

        let steps = 30; // 60 frames per second

        // Only update the marker if the distance is less than 1.0 mile
        if (distanceInMiles < 1.00) {
            // If an animation is currently running for this marker, wait for it to complete
            if (animations[vehicle.properties.vehicle_id]) {
                cancelAnimationFrame(animations[vehicle.properties.vehicle_id]);
            }

            animateMarker(vehicle, diffLng, diffLat, steps, currentCoordinates).then(() => {
                if (vehicle.properties) {
                    let newTimestamp = vehicle.properties.timestamp;
                    markers[vehicle.properties.vehicle_id].timestamp = parseInt(newTimestamp);
                }
            });
        }
    }
}


function updatePopup(vehicle) {
    // Get the existing marker
    let marker = markers[vehicle.vehicle.vehicle.id];

    // Check if the marker has a popup
    let popup = marker.getPopup();
    if (popup) {
        // Update the popup's HTML
        popup.setHTML(`
            <div style="display: flex; align-items: center;justify-content:center;">
                <span><b>${vehicle.vehicle.vehicle.id}</b></span>
            </div>
            ${vehicle}                        
            Data from: ${new Date(vehicle.vehicle.timestamp * 1000).toLocaleTimeString()}
        `);
    }
}


function createNewMarker(vehicle, features) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    const el = document.createElement('div');
    el.className = 'marker';

    const iconUrl = 'https://raw.githubusercontent.com/LACMTA/metro-iconography/main/Arrow.svg';
    el.style.background = `url(${iconUrl}) no-repeat center/cover`;

    const heading = vehicle.properties.position_bearing;
    wrapper.style.transform = `rotateZ(${heading}deg)`;
    wrapper.style.transformOrigin = "center";
    map.triggerRepaint();

    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundColor = 'white';
    el.style.borderRadius = '50%';
    el.style.cursor = 'pointer';

    const zoom = map.getZoom();
    const size = zoom >= 15 ? 40 : 40 * 0.5; // Increased size to 40px

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    wrapper.appendChild(el);
    const popup = new maplibregl.Popup()
    .setHTML(`
    <div style="display: flex; align-items: center;justify-content:center;">
    <img src="${routeIcons[vehicle.properties.route_code]}" style="width: 24px; height: 24px; border-radius: 50%;">
    <span><b>Line</b></span>
    </div>        
    Data from ${new Date(vehicle.properties.timestamp * 1000).toLocaleTimeString()}`);

    const marker = new maplibregl.Marker({element: wrapper, anchor: 'center'})
        .setLngLat(vehicle.geometry.coordinates)
        .setPopup(popup) // Set the popup
        .addTo(map);
    marker.bearing = vehicle.properties.position_bearing;
    marker.properties = {
        vehicle_id: vehicle.properties.vehicle_id,
        Heading: vehicle.properties.position_bearing
    };
    // Convert the timestamp to a number and store it
    marker.timestamp = parseInt(vehicle.properties.timestamp);
    marker.route_code = vehicle.properties.route_code;

    markers[vehicle.properties.vehicle_id] = marker;
    updateMarkerRotations();

    const feature = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [vehicle.geometry[0], vehicle.geometry[1]]
        },
        properties: {
            vehicle_id: vehicle.properties.vehicle_id,
            Heading: vehicle.properties.position_bearing
            
        }
    };
    features.push(feature);
}
map.on('rotate', function() {
    updateMarkerRotations();
});


map.on('zoom', function() {
    // Get the current zoom level
    const zoom = map.getZoom();

    // Calculate the size of the marker and the arrow based on the zoom level
    const markerSize = zoom >= 15 ? 32 : 32 * 0.5;
    const arrowSize = zoom >= 15 ? 5 : 5 * 0.5;

    // Update the size of each marker
    for (const vehicleId in markers) {
        const marker = markers[vehicleId];
        const el = marker.getElement();

        // Update the size of the marker
        el.style.width = `${markerSize}px`;
        el.style.height = `${markerSize}px`;
    }
});

function updateMarkerRotations() {
    // Get the map's current bearing
    const mapBearing = map.getBearing();

    // Iterate over each marker
    for (const vehicleId in markers) {
        const marker = markers[vehicleId];
        const el = marker.getElement().querySelector('.marker'); // This is the marker element
    // Get the bearing from the marker object
    const bearing = marker.properties.Heading;

    // Adjust the bearing by 180 degrees
    const adjustedBearing = (bearing + 180) % 360;

    // Calculate the final bearing based on the map's bearing
    const finalBearing = (adjustedBearing - mapBearing);

    // Apply the necessary transformations for correct placement and rotation
    el.style.transform = `translate(-50%, -50%) rotate(${finalBearing}deg)`;

        // Assuming `marker.popup` is the popup for the vehicle

    }
}
function updateMarker(vehicle) {
    // Get the existing marker
    let marker = markers[vehicle.id];

    // Update the marker's position and heading
    marker.setLngLat([vehicle.vehicle.position.longitude, vehicle.vehicle.position.latitude]);
    marker.getElement().style.transform = `rotate(${vehicle.vehicle.position.bearing + 180}deg)`;

    // Update the marker's properties
    marker.properties = {
        vehicle_id: vehicle.id,
        Heading: vehicle.vehicle.position.bearing,
        timestamp: parseInt(vehicle.vehicle.timestamp)
    };

    // Update the marker's popup
    marker.getPopup().setText(`Vehicle ID: ${vehicle.id}`);
}
