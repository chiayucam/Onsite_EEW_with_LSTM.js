function setMarkers(layerGroup, eventData, eventName) {
    eventData.forEach(function (datum) {
        popupHTML = `
        <p style="text-align:center;">
            <a href='waveformViewer.html?record=${eventName}${datum[2]}', style='font-size: 14px', Target='_blank'>
                ${datum[2]}
            </a><br>
            PGA: ${datum[3]}
        </p>
        `;
        marker = L.marker([datum[0], datum[1]]);
        marker.bindPopup(popupHTML);
        layerGroup.addLayer(marker);
    })
}

async function fetchJson(src) {
    const response = await fetch(src);
    return await response.json();
}

function formatEventName(eventName) {
    year = eventName.substring(0, 4)
    month = eventName.substring(4, 6)
    date = eventName.substring(6, 8)
    hour = eventName.substring(8, 10)
    minute = eventName.substring(10, 12)
    second = eventName.substring(12, 14)
    return `${year}/${month}/${date} ${hour}:${minute}:${second}`
}

// load leaflet map
let map = L.map('mapid');

map.setView(new L.LatLng(23.5, 120.5), 8);

let osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osm = new L.TileLayer(osmUrl, { minZoom: 5, maxZoom: 16 });
map.addLayer(osm);

// fetch event list json then feed event json data
let src = "event_data/event_list.json"
fetchJson(src).then(eventList => drawMap(eventList))


function drawMap(eventList) {
    let eventNames = Object.keys(eventList);
    let baseMaps = {};
    let layerGroup = [];
    eventNames.forEach(function (eventName) {
        src = `event_data/${eventName}.json`;
        layerGroup[eventName] = L.layerGroup().addTo(map);
        fetchJson(src).then(eventData => setMarkers(layerGroup[eventName], eventData, eventName));

        baseMaps[formatEventName(eventName)] = layerGroup[eventName]
    });

    L.control.layers(baseMaps).addTo(map)
};