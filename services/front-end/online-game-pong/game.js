import {loadHeader, timerDecrease} from "./header.js";
import {loadListeners, removeListeners} from "./listeners.js";
import loadMap from "./map.js";
import {clearBalls, createBall, getBallWithId} from "./ball.js";
import {createPlayers, getPlayerWithSide, stopPlayerLoop} from "./player.js";
import {closeWebSocket} from "./websocket.js";
import {navigateTo} from "../scripts/contentLoader.js";
import {displayStatistics} from "./statistics.js";
import {joinTournament} from "../scripts/tournament.js";

let globalGameLoop;

export function launchGame(socketValues) {
	createPlayers(socketValues);
	loadListeners();
	loadMap();
	loadHeader();
	createBall(socketValues);
	startGlobalGameLoop();
}

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

export function endGame(socketValues) {
	clearGame();
	closeWebSocket();

	if (socketValues["tournamentId"]) {
		joinTournament(socketValues["tournamentId"]);
		return;
	}

	navigateTo("/game-end", true);
	displayStatistics(socketValues);
}