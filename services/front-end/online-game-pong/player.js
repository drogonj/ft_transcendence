/*import {keyDown} from "./listeners.js"
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
import Statistics from "./statistics.js";*/

let player;

export default function createPlayer(socketData) {
	player = new Player(socketData)
}

function Player(socketData) {
	this.paddleHtml = document.getElementById(socketData.values["paddleHtml"]);
	this.paddleHeader = document.getElementById(socketData.values["paddleHeader"]);
	this.moveSpeed = socketData.values["moveSpeed"];
	this.moveStep = 1;
	this.paddleDirection = socketData.values["paddleDirection"];
	this.setTopPosition(socketData.values["playerTopPosition"])
	//this.playerSpells = getSpells(paddleDirection);
	//this.statistics = new Statistics();
	this.setPaddleSize(socketData.values["paddleSize"]);
	//addSpellsToHeader(this.paddleHeader, this.playerSpells);
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

Player.prototype.setTopPosition = function (newValue) {
	this.getPaddleStyle().top = newValue;
}

export function displayPlayerPoint(scoreHtml, text) {
	scoreHtml.textContent = text;
}

Player.prototype.setPaddleSize = function (size) {
	this.getPaddleStyle().height = size;
}

/*
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
}*/