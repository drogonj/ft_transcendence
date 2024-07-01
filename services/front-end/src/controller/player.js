import {keyDown} from "./listeners.js"
import {moveStep, moveSpeed} from "./settings.js";
import {
	movePlayerPaddleUp,
	movePlayerPaddleDown,
	displayPlayerPoint,
	displayPlayerPaddle
} from "../view/player_view.js";
import {getMapHeight} from "./map.js";
import {getRandomNumber} from "./math_utils.js";

const players = [];

export default function loadPlayers() {
	players.push(new Player(document.getElementsByClassName("playerPaddle")[0], -1, document.getElementById("headerLeft")));
	players.push(new Player(document.getElementsByClassName("playerPaddle")[1], 1, document.getElementById("headerRight")));

	tick();
}

function Player(paddleHtml, paddleDirection, paddleHeader) {
	this.paddleHtml = paddleHtml;
	this.paddleHeader = paddleHeader;
	this.paddleDirection = paddleDirection;
	this.playerTopPosition = getRandomNumber(3, 70);
	displayPlayerPaddle(this);
}

Player.prototype.paddleCanMoveUp = function() {
	return this.paddleHtml.offsetTop - moveStep > 0;
}

Player.prototype.paddleCanMoveDown = function() {
		return this.paddleHtml.getBoundingClientRect().bottom + moveStep < getMapHeight();
}

function tick() {
	if (keyDown['w']) {
		if (getLeftPaddle().paddleCanMoveUp())
			movePlayerPaddleUp(getLeftPaddle())
	} else if (keyDown['s']) {
		if (getLeftPaddle().paddleCanMoveDown())
			movePlayerPaddleDown(getLeftPaddle());
	}

	if (keyDown['ArrowUp']) {
		if (getRightPaddle().paddleCanMoveUp())
			movePlayerPaddleUp(getRightPaddle())
	} else if (keyDown['ArrowDown']) {
		if (getRightPaddle().paddleCanMoveDown())
			movePlayerPaddleDown(getRightPaddle());
	}
	setTimeout(tick, moveSpeed);
}

export function getLeftPaddle() {
	return players[0];
}

export function getRightPaddle() {
	return players[1];
}

export function getAllPaddles() {
	return players;
}

export function getLeftPlayerHeader() {
	return players[0].paddleHeader;
}

export function getRightPlayerHeader() {
	return players[1].paddleHeader;
}