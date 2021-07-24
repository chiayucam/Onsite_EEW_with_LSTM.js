function setMarkers(layerGroup, eventData) {
    eventData.forEach(function (datum) {
        marker = L.marker([datum[0], datum[1]]);
        marker.bindPopup("<a ID='hyp' href='http://www.abcsite/?param1=anyjavacriptvariable' Target='_blank'>"+datum[2]+"</a>");
        layerGroup.addLayer(marker);
    })
}

async function fetchJson(src) {
    const response = await fetch(src);
    return await response.json();
}

// load leaflet map
let map = L.map('mapid');

map.setView(new L.LatLng(23.5, 120.5), 8);

let osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osm = new L.TileLayer(osmUrl, { minZoom: 5, maxZoom: 16 });
map.addLayer(osm);

// fetch event list



// fetch event json data
let eventNames = ["20160205195727", "20180206155042"];
let layerGroup = [];
let src;

eventNames.forEach(function (eventName) {
    src = `https://chiayucam.github.io/Onsite_EEW_with_LSTM.js/event_data/${eventName}.json`;
    layerGroup[eventName] = L.layerGroup().addTo(map);
    fetchJson(src).then(eventData => setMarkers(layerGroup[eventName], eventData));
});


let baseMaps = {
    "2016/02/05 19:57:27": layerGroup[eventNames[0]],
    "2018/02/06 15:50:42": layerGroup[eventNames[1]]
}

L.control.layers(baseMaps).addTo(map)
