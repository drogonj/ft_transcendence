let mapHeight;

export default function loadMap() {
	mapHeight = document.getElementById("map").offsetHeight;
}

export function getMapHeight() {
	return mapHeight;
}