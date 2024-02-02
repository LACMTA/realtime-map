import requests
import json

# URL of the GeoJSON data
url = "https://api.metro.net/LACMTA/trip_shapes/all"
# Send a GET request to the URL
response = requests.get(url)

# Parse the response as JSON
data = response.json()

# Initialize an empty FeatureCollection
flattened = {
    "type": "FeatureCollection",
    "features": []
}

# Loop through the GeoJSONs and add them to the flattened GeoJSON
for feature in data:
    flattened["features"].append(feature)

# Write the flattened GeoJSON to a file
with open('flattened_bus.geojson', 'w') as f:
    json.dump(flattened, f)

    