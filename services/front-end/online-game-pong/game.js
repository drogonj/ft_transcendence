import {loadHeader, timerDecrease} from "./header.js";
import {loadListeners, removeListeners} from "./listeners.js";
import loadMap from "./map.js";
import {clearBalls, createBall, getBallWithId} from "./ball.js";
import {createPlayers, getPlayerWithSide, stopPlayerLoop} from "./player.js";

let gameId;
let globalGameLoop;

export function launchGame(socketValues) {
	gameId = socketValues["gameId"];
	createPlayers(socketValues);
	loadListeners();
	loadMap();
	loadHeader();
	createBall(socketValues);
	startGlobalGameLoop();
}

/*
export function endGame() {
	renderPageWithName("menu-end.html");
	displayStatistics(getLeftPaddle().statistics, getRightPaddle().statistics);
}*/

function startGlobalGameLoop() {
	timerDecrease();
	globalGameLoop = setTimeout(startGlobalGameLoop, 1000);
}

export function removeCssProperty(cssStyle, property) {
	cssStyle.removeProperty(property);
}

export function setCssProperty(cssStyle, property, value) {
	cssStyle.setProperty(property, value);
}

export function newImage(imagePath, id, className) {
	const img = new Image();

	img.onerror = function() {
		throw new Error(`Failed to load image ` + imagePath);
	};

	img.src = imagePath;
	img.setAttribute('id', id);
	img.setAttribute('draggable', "false");
	if (className)
		img.classList.add(className);
	return img;
}

export function getGameId() {
	return gameId;
}

export function markPoint(socketValues) {
	const ball = getBallWithId(socketValues["ballId"]);
	const targetPlayer = getPlayerWithSide(socketValues["targetPlayer"]);
	ball.deleteBall();
	targetPlayer.increaseScore();
	targetPlayer.displayPoint()
}

export function clearGame() {
	clearBalls();
	stopPlayerLoop();
	removeListeners();
	clearTimeout(globalGameLoop);
}