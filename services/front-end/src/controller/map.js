let map;

export default function loadMap() {
	map = new Map();
}

function Map() {
	this.mapHtml = document.getElementById("map");
}

export function getMapHeight() {
	return map.mapHtml.getBoundingClientRect().height;
}

export function getMapWidth() {
	return map.mapHtml.getBoundingClientRect().width;
}

export function getMapLeft() {
	return map.mapHtml.getBoundingClientRect().left;
}

export function getMapRight() {
	return map.mapHtml.getBoundingClientRect().right;
}