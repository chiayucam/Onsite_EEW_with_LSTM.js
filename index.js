var map = L.map('mapid');

map.setView(new L.LatLng(23.5, 120.5), 8);

var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osm = new L.TileLayer(osmUrl, {minZoom: 5, maxZoom: 16});
map.addLayer(osm);