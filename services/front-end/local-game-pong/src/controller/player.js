import {keyDown} from "./listeners.js"
import {moveStep, moveSpeed, paddleSize, maxScore, aiActive, spellsActive} from "./settings.js";
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
import PaddleStun from "./spells/paddle_stun.js";

let playerLoop;
const players = [];

export default function loadPlayers() {
	players.length = 0;
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
	this.keys = definePlayerKeys(this);
	if (spellsActive) {
		this.playerSpells = getSpells(paddleDirection);
		this.playerSpells.push(new PaddleStun());
		addSpellsToHeader(this.paddleHeader, this.playerSpells);
	}
	this.statistics = new Statistics();
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

Player.prototype.getStatistics = function () {
	return this.statistics;
}

export function startPlayersLoop() {
	leftPlayerTriggerKeys(getLeftPaddle());
	if (!aiActive)
 		rightPlayerTriggerKeys(getRightPaddle());
	playerLoop = setTimeout(startPlayersLoop, moveSpeed);
}

function leftPlayerTriggerKeys(leftPaddle) {
	if (keyDown.has(leftPaddle.keys[0])) {
		if (leftPaddle.paddleCanMoveUp())
			movePlayerPaddleUp(leftPaddle)
	} else if (keyDown.has(leftPaddle.keys[1])) {
		if (leftPaddle.paddleCanMoveDown())
			movePlayerPaddleDown(leftPaddle);
	}

	if (!spellsActive)
		return;

	if (keyDown.has(leftPaddle.keys[2])) {
		leftPaddle.playerSpells[0].executor(leftPaddle);
	} else if (keyDown.has(leftPaddle.keys[3])) {
		leftPaddle.playerSpells[1].executor(leftPaddle);
	} else if (keyDown.has(leftPaddle.keys[4])) {
		leftPaddle.playerSpells[2].executor(leftPaddle);
	} else if (keyDown.has(leftPaddle.keys[5])) {
		leftPaddle.playerSpells[3].executor(leftPaddle);
	}
}

function rightPlayerTriggerKeys(rightPaddle) {
	if (keyDown.has(rightPaddle.keys[0])) {
		if (rightPaddle.paddleCanMoveUp())
			movePlayerPaddleUp(rightPaddle)
	} else if (keyDown.has(rightPaddle.keys[1])) {
		if (rightPaddle.paddleCanMoveDown())
			movePlayerPaddleDown(rightPaddle);
	}

	if (!spellsActive)
		return;

	if (keyDown.has(rightPaddle.keys[2])) {
		rightPaddle.playerSpells[0].executor(rightPaddle);
	} else if (keyDown.has(rightPaddle.keys[3])) {
		rightPaddle.playerSpells[1].executor(rightPaddle);
	} else if (keyDown.has(rightPaddle.keys[4])) {
		rightPaddle.playerSpells[2].executor(rightPaddle);
	} else if (keyDown.has(rightPaddle.keys[5])) {
		rightPaddle.playerSpells[3].executor(rightPaddle);
	}
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

export function stopPlayerLoop() {
	clearTimeout(playerLoop);
}

function definePlayerKeys(player) {
	if (aiActive)
		return ["ArrowUp", "ArrowDown", "Digit1", "Digit2", "Digit3", "Digit4"];

	if (player.paddleDirection === 1)
		return ["ArrowUp", "ArrowDown", "Numpad1", "Numpad2", "Numpad3", "Numpad4"];
	else
		return ["KeyW", "KeyS", "Digit1", "Digit2", "Digit3", "Digit4"];
}