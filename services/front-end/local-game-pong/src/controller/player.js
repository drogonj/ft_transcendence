import {keyDown} from "./listeners.js"
import {moveStep, moveSpeed, paddleSize, maxScore} from "./settings.js";
import {
	movePlayerPaddleUp,
	movePlayerPaddleDown,
	displayPlayerPaddle, setPaddleSize
} from "../view/player_view.js";
import {getMapHeight} from "./map.js";
import {getRandomNumber} from "./utils/math_utils.js";
import {getSpells} from "./spell.js";
import {addSpellsToHeader} from "../view/header_view.js";
import Statistics from "./statistics.js";

const players = [];

export default function loadPlayers() {
	players.push(new Player(document.getElementsByClassName("playerPaddle")[0], -1, document.getElementById("headerLeft")));
	players.push(new Player(document.getElementsByClassName("playerPaddle")[1], 1, document.getElementById("headerRight")));
}

function Player(paddleHtml, paddleDirection, paddleHeader) {
	this.paddleHtml = paddleHtml;
	this.paddleHeader = paddleHeader;
	this.moveSpeed = moveSpeed;
	this.moveStep = 1;
	this.paddleDirection = paddleDirection;
	this.playerTopPosition = getRandomNumber(3, 70);
	this.playerSpells = getSpells(paddleDirection);
	this.statistics = new Statistics();
	setPaddleSize(this, paddleSize);
	displayPlayerPaddle(this);
	addSpellsToHeader(this.paddleHeader, this.playerSpells);
}

Player.prototype.paddleCanMoveUp = function() {
	return this.paddleHtml.offsetTop - moveStep > 0;
}

Player.prototype.paddleCanMoveDown = function() {
		return this.paddleHtml.getBoundingClientRect().bottom + moveStep < getMapHeight();
}

Player.prototype.triggerKey = function() {
	keyDown.forEach((key) => {

	})
	setTimeout(this.triggerKey, this.moveSpeed);
}

Player.prototype.getPaddleHeight = function () {
	return parseInt(this.paddleHtml.style.height);
}

Player.prototype.getPaddleStyle = function () {
	return this.paddleHtml.style;
}

Player.prototype.getStatistics = function () {
	return this.statistics;
}

export function startPlayersLoop() {
	if (keyDown.has('KeyW')) {
		if (getLeftPaddle().paddleCanMoveUp())
			movePlayerPaddleUp(getLeftPaddle())
	} else if (keyDown.has('KeyS')) {
		if (getLeftPaddle().paddleCanMoveDown())
			movePlayerPaddleDown(getLeftPaddle());
	} else if (keyDown.has('Digit1')) {
		getLeftPaddle().playerSpells[0].executor(getLeftPaddle());
	} else if (keyDown.has('Digit2')) {
		getLeftPaddle().playerSpells[1].executor(getLeftPaddle());
	} else if (keyDown.has('Digit3')) {
		getLeftPaddle().playerSpells[2].executor(getLeftPaddle());
	} else if (keyDown.has('Digit4')) {
		getLeftPaddle().playerSpells[3].executor(getLeftPaddle());
	}

	if (keyDown.has('ArrowUp')) {
		if (getRightPaddle().paddleCanMoveUp())
			movePlayerPaddleUp(getRightPaddle())
	} else if (keyDown.has('ArrowDown')) {
		if (getRightPaddle().paddleCanMoveDown())
			movePlayerPaddleDown(getRightPaddle());
	} else if (keyDown.has('Numpad1')) {
		getRightPaddle().playerSpells[0].executor(getRightPaddle());
	} else if (keyDown.has('Numpad2')) {
		getRightPaddle().playerSpells[1].executor(getRightPaddle());
	} else if (keyDown.has('Numpad3')) {
		getRightPaddle().playerSpells[2].executor(getRightPaddle());
	} else if (keyDown.has('Numpad4')) {
		getRightPaddle().playerSpells[3].executor(getRightPaddle());
	}
	setTimeout(startPlayersLoop, moveSpeed);
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

export function getOpponentPaddle(paddle) {
	if (paddle.paddleDirection === -1)
		return getRightPaddle();
	return getLeftPaddle();
}

export function havePlayersMaxScore() {
	return getRightPaddle().statistics.getScore() >= maxScore || getLeftPaddle().statistics.getScore() >= maxScore;
}