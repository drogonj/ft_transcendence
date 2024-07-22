import {maxBall} from "./settings.js";
import {getBallNumber} from "./ball.js";

let map;

export default function loadMap() {
	map = new Map();
}

function Map() {
	this.mapHtml = document.getElementById("map");
	this.computedStyle = getComputedStyle(this.mapHtml);
}

/**
 * Gets the map bottom value of the map excluding the border.
 *
 * @returns {number}
 */

export function getMapHeight() {
	return map.mapHtml.getBoundingClientRect().bottom - getMapBorderHeight();
}

export function getMapTop() {
		return map.mapHtml.getBoundingClientRect().top;
}

export function getMapWidth() {
	return map.mapHtml.getBoundingClientRect().width;
}

export function getMapLeft() {
	return map.mapHtml.getBoundingClientRect().left + getMapBorderHeight();
}

export function getMapRight() {
	return map.mapHtml.getBoundingClientRect().right - getMapBorderHeight();
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

export function isMapContainMaxBall() {
	return maxBall <= getBallNumber();
}

export function isMapContainNoBall() {
	return getBallNumber() === 0;
}

function getMapBorderHeight() {
	return parseInt(map.computedStyle.borderBottom)
}

function getMapBorderWidth() {
	return parseInt(map.computedStyle.borderRightWidth);
}