let map;

export default function loadMap() {
	map = new Map();
}

function Map() {
	this.mapHtml = document.getElementById("map");
	this.computedStyle = getComputedStyle(this.mapHtml);
}

export function getMapHeight() {
	return map.mapHtml.getBoundingClientRect().height - parseInt(map.computedStyle.borderBottomWidth);
}

export function getMapWidth() {
	return map.mapHtml.getBoundingClientRect().width;
}

export function getMapLeft() {
	return map.mapHtml.getBoundingClientRect().left + parseInt(map.computedStyle.borderLeftWidth);
}

export function getMapRight() {
	return map.mapHtml.getBoundingClientRect().right - parseInt(map.computedStyle.borderRightWidth);
}

export function addBallToMap(ballHtml) {
	map.mapHtml.appendChild(ballHtml);
}

export function isBottomPartOfMap(y) {
	return y > getMapHeight() / 2;
}

export function isTopPartOfMap(y) {
	return y < getMapHeight() / 2;
}