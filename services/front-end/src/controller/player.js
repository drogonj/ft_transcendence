import {keyDown} from "./listeners.js"
import {moveStep, moveSpeed, paddleSize} from "./settings.js";
import {
	movePlayerPaddleUp,
	movePlayerPaddleDown,
	displayPlayerPaddle, setPaddleSize
} from "../view/player_view.js";
import {getMapHeight} from "./map.js";
import {getRandomNumber} from "./math_utils.js";
import {getRandomSpells} from "./spell.js";

const players = [];

export default function loadPlayers() {
	players.push(new Player(document.getElementsByClassName("playerPaddle")[0], -1, document.getElementById("headerLeft")));
	players.push(new Player(document.getElementsByClassName("playerPaddle")[1], 1, document.getElementById("headerRight")));

	tick();
}

function Player(paddleHtml, paddleDirection, paddleHeader) {
	this.paddleHtml = paddleHtml;
	this.paddleHeader = paddleHeader;
	this.moveSpeed = moveSpeed;
	this.moveStep = 1;
	this.paddleDirection = paddleDirection;
	this.playerTopPosition = getRandomNumber(3, 70);
	this.playerSpells = getRandomSpells();
	setPaddleSize(this, paddleSize);
	displayPlayerPaddle(this);
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

function tick() {
	if (keyDown.has('w')) {
		if (getLeftPaddle().paddleCanMoveUp())
			movePlayerPaddleUp(getLeftPaddle())
	} else if (keyDown.has('s')) {
		if (getLeftPaddle().paddleCanMoveDown())
			movePlayerPaddleDown(getLeftPaddle());
	} else if (keyDown.has('1')) {
		getLeftPaddle().playerSpells[0].executor(getLeftPaddle());
	} else if (keyDown.has('2')) {
		getLeftPaddle().playerSpells[1].executor(getLeftPaddle());
	} else if (keyDown.has('3')) {
		getLeftPaddle().playerSpells[2].executor(getLeftPaddle());
	} else if (keyDown.has('4')) {
		getLeftPaddle().playerSpells[3].executor(getLeftPaddle());
	}

	if (keyDown.has('ArrowUp')) {
		if (getRightPaddle().paddleCanMoveUp())
			movePlayerPaddleUp(getRightPaddle())
	} else if (keyDown.has('ArrowDown')) {
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

export function getOpponentPaddle(paddle) {
	if (paddle.paddleDirection === -1)
		return getRightPaddle();
	return getLeftPaddle();
}