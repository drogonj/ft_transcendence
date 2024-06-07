let map;

export default function loadMap() {
	map = new Map();
}

function Map() {
	this.mapHtml = document.getElementById("map");
}

export function getMapHeight() {
	return map.mapHtml.offsetHeight;
}

export function getMapWidth() {
	return map.mapHtml.offsetWidth;
}