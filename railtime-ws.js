// config options
const ESRI_KEY = 'AAPKccc2cf38fecc47649e91529acf524abflSSkRTjWwH0AYmZi8jaRo-wdpcTf6z67CLCkOjVYlw3pZyUIF_Y4KGBndq35Y02z'
const MAPTILER_KEY = 'KydZlIiVFdYDFFfQ4QYq'
const basemapEnum = '65aff2873118478482ec3dec199e9058'
const timer = setTimeout(() => {
  document.getElementById('loading').innerHTML = "Sorry, loading timed out: we're currently unable to load data. Please check your connection or try again later."
}, 25000) // 25 seconds

// Create a map of vehicle IDs to markers
const markers = {}

// Get the current time
const now = new Date()

// Convert the current time to PST
const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))

// map setup

const map = new maplibregl.Map({
  container: 'map',
  center: [-118.25133692966446, 34.05295151499077],
  zoom: 9,
  pitch: 20,
  bearing: 0,
  antialias: true,
  minZoom: 8, // Minimum zoom level
  style: `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/items/${basemapEnum}?token=${ESRI_KEY}`
})

const routeIcons = {
  801: 'https://lacmta.github.io/metro-iconography/Service_ALine.svg',
  802: 'https://lacmta.github.io/metro-iconography/Service_BLine.svg',
  803: 'https://lacmta.github.io/metro-iconography/Service_CLine.svg',
  804: 'https://lacmta.github.io/metro-iconography/Service_ELine2.svg',
  806: 'https://lacmta.github.io/metro-iconography/Service_LLine.svg',
  807: 'https://lacmta.github.io/metro-iconography/Service_KLine.svg',
  805: 'https://lacmta.github.io/metro-iconography/Service_DLine.svg',
  901: 'https://lacmta.github.io/metro-iconography/Service_GLine.svg',
  910: 'https://lacmta.github.io/metro-iconography/Service_JLine.svg'
}

// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', () => {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers

  let labelLayerId
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id
      break
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
  const apiUrl = `https://api.metro.net/LACMTA_Rail/vehicle_positions?format=geojson&nocache=${new Date().getTime()}`

  map.addSource('vehicles', {
    type: 'geojson',
    data: apiUrl
  })
  // Declare and initialize the popups object
  const popups = {}
  const brtUrl = 'https://api.metro.net/LACMTA/vehicle_positions/route_code/901%2C910?format=geojson'

  // Extract the fetch logic into a separate function

  function handleError (error) {
    if (error instanceof TypeError) {
      document.getElementById('loading').innerHTML = "We're experiencing technical difficulties with our data. We're attempting to reload the data. Please wait<span class='dot1'>.</span><span class='dot2'>.</span><span class='dot3'>.</span>"
      console.error('TypeError caught: ', error)
      // Retry loading data
    } else if (error instanceof SyntaxError) {
      document.getElementById('loading').innerHTML = "We're currently facing some technical issues. Our team is working on it. Please try again later."
    } else if (error instanceof ReferenceError) {
      document.getElementById('loading').innerHTML = "We're unable to find some necessary information. Please try again later."
    } else {
      document.getElementById('loading').innerHTML = `We're experiencing unexpected issues: ${error.message}. Our team is looking into it. Please try again later.`
    }
  }


  function processData(data1, data2) {
    validateData(data1, data2)
    const data = combineData(data1, data2)
    clearTimeout(timer)
    updateMarkersAndMap(data, markers, map)
    updateUI()
  }

  function validateData(data1, data2) {
    if (!(data1 && data1.features)) {
      throw new Error('The first response does not have a features property')
    }

    if (typeof data2 !== 'object') {
      throw new Error('The second response is not an object')
    }
  }

  function combineData(data1, data2) {
    return {
      features: [
        ...data1.features,
        ...Object.values(data2).flatMap(d => d.features || [])
      ]
    }
  }

  function updateMarkersAndMap(data, markers, map) {
    removeOldMarkers(data, markers)

    data.features.filter(vehicle => vehicle.properties && vehicle.properties.trip_id).forEach(vehicle => {
      updateMarker(vehicle, markers, map)
    })

    map.getSource('vehicles').setData({
      type: 'FeatureCollection',
      features: []
    })
  }

  function updateUI() {
    const now = new Date()
    const updateTimeDiv = document.getElementById('update-time')

    updateTimeDiv.innerHTML = `Updated at ${now.toLocaleTimeString()} <i class="fas fa-sync-alt"></i>`
    updateTimeDiv.style.fontSize = '12px'

    const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
    const hour = pst.getHours()

    if (Object.keys(markers).length > 1) {
      hideLoadingDiv()
    }
  }

  function animateMarker(i, steps, diffLng, diffLat, currentCoordinates, vehicle, markers, map) {
    if (i <= steps) {
      const progress = i / steps
      const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      markers[vehicle.properties.vehicle_id].setLngLat([
        currentCoordinates.lng + easedProgress * diffLng,
        currentCoordinates.lat + easedProgress * diffLat
      ])

      const zoom = map.getZoom()
      const markerSize = zoom >= 15 ? 32 : 32 * 0.5
      const el = markers[vehicle.properties.vehicle_id].getElement()
      el.style.width = `${markerSize}px`
      el.style.height = `${markerSize}px`

      requestAnimationFrame(() => animateMarker(i + 1, steps, diffLng, diffLat, currentCoordinates, vehicle, markers, map))
    }
  }

  function updateExistingMarker(vehicle, markers, map) {
    const currentCoordinates = markers[vehicle.properties.vehicle_id].getLngLat()
    if (vehicle.geometry && vehicle.geometry.coordinates) {
      const diffLng = vehicle.geometry.coordinates[0] - currentCoordinates.lng
      const diffLat = vehicle.geometry.coordinates[1] - currentCoordinates.lat
      const distance = Math.sqrt(diffLng * diffLng + diffLat * diffLat)
      const steps = 9000 / 60

      if(distance > 0.001) {
        const lngStep = diffLng / steps
        const latStep = diffLat / steps

        if (vehicle.properties) {
          markers[vehicle.properties.vehicle_id].properties.Heading = vehicle.properties.position_bearing
        }

        animateMarker(0, steps, diffLng, diffLat, currentCoordinates, vehicle, markers, map)
      }

      if (vehicle.properties) {
        const newTimestamp = vehicle.properties.timestamp
        markers[vehicle.properties.vehicle_id].timestamp = newTimestamp
      }

      const popup = markers[vehicle.properties.vehicle_id].getPopup()
      if (popup) {
        popup.setHTML(`
                <div style="display: flex; align-items: center;justify-content:center;">
                    <img src="${routeIcons[markers[vehicle.properties.vehicle_id].route_code]}" style="width: 24px; height: 24px; border-radius: 50%;">
                    <span><b>Line</b></span>
                </div>                        
                Data from: ${new Date(markers[vehicle.properties.vehicle_id].timestamp * 1000).toLocaleTimeString()}
            `)
      }
    }
  }

  function createNewMarker(vehicle, markers, map) {
    const wrapper = document.createElement('div')
    wrapper.className = 'wrapper'
    const el = document.createElement('div')
    el.className = 'marker'

    const iconUrl = 'https://raw.githubusercontent.com/LACMTA/metro-iconography/main/Arrow.svg'
    el.style.background = `url(${iconUrl}) no-repeat center/cover`

    const heading = vehicle.properties.position_bearing
    wrapper.style.transform = `rotateZ(${heading}deg)`

    map.triggerRepaint()

    el.style.backgroundRepeat = 'no-repeat'
    el.style.backgroundSize = 'cover'
    el.style.backgroundPosition = 'center'
    el.style.backgroundColor = 'white'
    el.style.borderRadius = '50%'
    el.style.cursor = 'pointer'

    const zoom = map.getZoom()
    const size = zoom >= 15 ? 40 : 40 * 0.5
    el.style.width = `${size}px`
    el.style.height = `${size}px`

    wrapper.appendChild(el)

    const popup = new maplibregl.Popup()
      .setHTML(`
      <div style="display: flex; align-items: center; justify-content: center;">
          <img src="${routeIcons[vehicle.properties.route_code]}" style="width: 24px; height: 24px; border-radius: 50%;">
          <span><b>Line</b></span>
      </div>
      Data from ${new Date(vehicle.properties.timestamp * 1000).toLocaleTimeString()}`)

    const marker = new maplibregl.Marker({ element: wrapper })
      .setLngLat(vehicle.geometry.coordinates)
      .setPopup(popup)
      .addTo(map)

    marker.bearing = vehicle.properties.position_bearing
    marker.properties = {
      vehicle_id: vehicle.properties.vehicle_id,
      Heading: vehicle.properties.position_bearing
    }
    marker.timestamp = vehicle.properties.timestamp
    marker.route_code = vehicle.properties.route_code

    markers[vehicle.properties.vehicle_id] = marker
    updateMarkerRotations()

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
    }
    features.push(feature)
  }

  function updateMarker(vehicle, markers, map) {
    if (markers[vehicle.properties.vehicle_id]) {
      updateExistingMarker(vehicle, markers, map)
    } else {
      createNewMarker(vehicle, markers, map)
    }
  }

  function removeOldMarkers(data, markers) {
    if(data.features.length > 0) {
      const newVehicleIds = new Set(data.features.map(vehicle => vehicle.properties.vehicle_id))

      // Remove markers that are not in the new data
      for (const vehicle_id in markers) {
        if (!newVehicleIds.has(vehicle_id)) {
          // The marker is not in the new data, remove it from the map
          markers[vehicle_id].remove()

          // Delete the marker from the markers object
          delete markers[vehicle_id]
        }
      }
    }
  }

  function fetchRouteShapesData() {
  // Add the new URLs
    const urls = [
      'https://api.metro.net/LACMTA_Rail/trip_shapes/all',
      'https://api.metro.net/LACMTA/trip_shapes/9100209_DEC23',
      'https://api.metro.net/LACMTA/trip_shapes/9010054_DEC23'
    ]

    // Fetch data from all URLs
    return Promise.all(urls.map(url => fetch(url).then(response => response.json())))
      .then(data => {
        // Combine the data from all responses
        routeShapesData = {
          type: 'FeatureCollection',
          features: data.map(d => d)
        }
      })
      .catch(error => {
        // Call a function to handle errors
        handleError(error)
      })
  }

  function handleError(error) {
    console.error('==error==')
    console.error(error)
    document.getElementById('loading').style.display = 'block'
    if (error instanceof TypeError) {
      document.getElementById('loading').innerHTML = "We're experiencing technical difficulties with our data. We're attempting to reload the data. Please wait<span class='dot1'>.</span><span class='dot2'>.</span><span class='dot3'>.</span>"
      console.error('TypeError caught: ', error)
      // Retry loading data
    } else if (error instanceof SyntaxError) {
      document.getElementById('loading').innerHTML = "We're currently facing some technical issues. Our team is working on it. Please try again later."
    } else if (error instanceof ReferenceError) {
      document.getElementById('loading').innerHTML = "We're unable to find some necessary information. Please try again later."
    } else {
      document.getElementById('loading').innerHTML = `We're experiencing unexpected issues: ${error.message}. Our team is looking into it. Please try again later.`
    }
  }

  // Fetch data when the page loads
  fetchRouteShapesData()
  // Fetch data every 9000 milliseconds
  // window.setInterval(fetchData, 9000);

  // Define a function to hide the loading div
  function hideLoadingDiv() {
    document.getElementById('loading').style.display = 'none'
  }
  const updateTimeDivDom = document.getElementById('update-time')
  // Add an event listener to the update time div
  updateTimeDivDom.addEventListener('click', function () {
  // Add the loading class to animate the div
    updateTimeDivDom.innerHTML = 'Loading...'
    updateTimeDivDom.classList.add('loading')

    // Fetch new data
    fetchData().then(() => {
      // Remove the loading class and show the refresh icon when the data is loaded
      updateTimeDivDom.classList.remove('loading')
      updateTimeDivDom.innerHTML = `Updated at ${new Date().toLocaleTimeString()} &#x21BB;`
    })
  })
  // Call the updateArrow function whenever the map moves
  const features = []
  map.addSource('openmaptiles', {
    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
    type: 'vector'
  })

  map.addLayer({
    id: 'vehicles',
    type: 'symbol',
    source: 'vehicles',
    layout: {
      'icon-image': 'rail',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true
    }
  })
  map.addLayer(
    {
      id: '3d-buildings',
      source: 'openmaptiles',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'render_height'], 0, 'lightgray', 200, 'hsl(38, 28%, 77%)', 400, 'hsl(38, 28%, 77%)'
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
  )
})

// Add navigation controls to the top-left corner of the map
map.addControl(new maplibregl.NavigationControl(), 'top-left')
// Create a home button
class HomeControl {
  onAdd(map) {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl'
    const button = document.createElement('button')
    button.className = 'maplibregl-ctrl-icon home-icon' // Add 'home-icon' class
    button.innerHTML = '<i class="fas fa-home"></i>'
    button.addEventListener('click', () => {
      this.map.flyTo({
        center: [-118.25133692966446, 34.05295151499077],
        zoom: 9,
        pitch: 20,
        bearing: 0
      })
    })
    this.container.appendChild(button)
    return this.container
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container)
    this.map = undefined
  }
}

window.onload = function () {
  const legend = document.getElementById('legend')
  const toggleLegend = document.getElementById('toggle-legend')

  if (legend && toggleLegend) {
    legend.addEventListener('click', function () {
      this.classList.toggle('hidden')

      // Change the icon based on the visibility
      toggleLegend.innerHTML = this.classList.contains('hidden') ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-chevron-left"></i>'
    })
  } else {
    console.error('Element not found')
  }
}

// Add the home control to the map
// Assuming your vehicle layer is named 'vehicle-layer'
// Create a mapping from route codes to route names
const routeNames = {
  801: 'A Line',
  802: 'B Line',
  803: 'C Line',
  804: 'L Line',
  806: 'E Line',
  807: 'K Line',
  805: 'D Line',
  901: 'G Line',
  910: 'J Line'

}

map.addControl(new HomeControl(), 'top-left')
map.on('zoom', function () {
  // Get the current zoom level
  const zoom = map.getZoom()

  // Calculate the size of the marker and the arrow based on the zoom level
  const markerSize = zoom >= 15 ? 32 : 32 * 0.5
  const arrowSize = zoom >= 15 ? 5 : 5 * 0.5

  // Update the size of each marker
  for (const vehicleId in markers) {
    const marker = markers[vehicleId]
    const el = marker.getElement()

    // Update the size of the marker
    el.style.width = `${markerSize}px`
    el.style.height = `${markerSize}px`
  }
})
map.on('rotate', function () {
  updateMarkerRotations()
})
function updateMarkerRotations() {
  // Get the map's current bearing
  const mapBearing = map.getBearing()

  // Iterate over each marker
  for (const vehicleId in markers) {
    const marker = markers[vehicleId]
    const el = marker.getElement().querySelector('.marker') // This is the marker element

    // Get the bearing from the marker object
    const bearing = marker.properties.Heading

    // Adjust the bearing by 180 degrees
    const adjustedBearing = (bearing + 180) % 360

    // Calculate the final bearing based on the map's bearing
    const finalBearing = (adjustedBearing - mapBearing)

    // Apply the necessary transformations for correct placement and rotation
    el.style.transform = `translate(-50%, -50%) rotateZ(${finalBearing}deg)`

    // Assuming `marker.popup` is the popup for the vehicle
  }
}
// Bounding box coordinates for Los Angeles County
const LA_COUNTY_BOUNDS = {
  north: 34.8233,
  south: 33.7037,
  west: -118.6682,
  east: -117.6462
}
// Check if Geolocation API is available
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(function (position) {
    const lat = position.coords.latitude
    const lng = position.coords.longitude

    // Check if the user is in Los Angeles County
    if (lat >= LA_COUNTY_BOUNDS.south && lat <= LA_COUNTY_BOUNDS.north && lng >= LA_COUNTY_BOUNDS.west && lng <= LA_COUNTY_BOUNDS.east) {
      // Create a new HTML element for the user's location
      const userLocation = document.createElement('div')
      userLocation.id = 'userLocation'
      userLocation.className = 'pulsatingIcon'

      // Add the user's location to the map
      // Create a new marker
      const marker = new maplibregl.Marker(userLocation)
        .setLngLat([lng, lat])

      // Zoom in to the user's location
      map.flyTo({ center: [lng, lat], zoom: 12 })

      // Add a circle to represent the accuracy of the geolocation
      const accuracy = position.coords.accuracy
      map.addSource('circle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          }]
        }
      })
      map.addLayer({
        id: 'circle',
        type: 'circle',
        source: 'circle',
        paint: {
          'circle-radius': accuracy,
          'circle-color': '#007cbf',
          'circle-opacity': 0.3
        }
      })
    }
  })
} else {
  console.log('Geolocation is not supported by this browser.')
}
// Add geolocate control to the map.
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true
})

map.addControl(geolocate, 'top-left')


// Set the map's center to the user's location once it's available
geolocate.on('geolocate', function (e) {
  map.flyTo({ center: [e.coords.longitude, e.coords.latitude], zoom: 14 })
})
function startWebSocket() {
  // Create WebSocket connection
  const socket = new WebSocket('wss://api.metro.net/ws/LACMTA_Rail/vehicle_positions')

  // Connection opened
  socket.addEventListener('open', (event) => {
    console.log('Connection opened')
  })

  // Listen for messages
  socket.addEventListener('message', (event) => {
    console.log('Message from server: ', event.data)
    const data = JSON.parse(event.data)

    // Check if data has a features property
    if (!(data && data.features)) {
      throw new Error('The response does not have a features property')
    }

    processData(data)
  })

  // Connection closed
  socket.addEventListener('close', (event) => {
    console.log('Connection closed')
  })

  // Connection error
  socket.addEventListener('error', (event) => {
    console.error('WebSocket error: ', event)
  })
}