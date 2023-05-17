// declare variables
let mapOptions = {'center': [34.0709,-118.444],'zoom':5};

// use the variables
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// create a function to add markers
function addMarker(lat,lng,title,message){
    console.log(message)
    L.marker([lat,lng]).addTo(map).bindPopup(`<h2>${title}</h2> <h3>${message}</h3>`)
    return message
}

const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpOaH94y-oguAqbtcvZRyKdrEYiT1JOzW0jmmreznYS8THdQTYQ6cUB7J_68SZLgjpXbB_FY_nDf2A/pub?output=csv"

function loadData(url){
    Papa.parse(url, {
        download: true,
        header: true,
        complete: results => processData(results)
    })

}

function processData(csv){
    console.log(csv.data)
    csv.data.forEach(item => {
        addMarker(item.lat,item.lng,item['OpenEnded'],item['Is your English your first language?'])
    })
}

// we will put this comment to remember to call our function later!
loadData(dataUrl);