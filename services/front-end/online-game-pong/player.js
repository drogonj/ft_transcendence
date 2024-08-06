import {keyDown} from "./listeners.js";
import {sendMessageToServer} from "./websocket.js";
import {getSpellWithId} from "./spell.js";
import {addSpellsToHeader} from "./header.js";
import {getGameId} from "./game.js";

const players = [];
let clientSide;
const playerKeys = {
		"moveUp": "ArrowUp",
		"moveDown": "ArrowDown",
		"spell1": "Digit1",
		"spell2": "Digit2",
		"spell3": "Digit3",
		"spell4": "Digit4"
}

export function createPlayers(socketValues) {
	clientSide = socketValues["clientSide"];
	let side = "Left";
	for (let i = 0; i < 2; i++) {
		new Player(socketValues, side)
		side = "Right";
	}
	startPlayerLoop();
}

function Player(socketValues, side) {
	this.paddleHtml = document.getElementById("paddle" + side);
	this.paddleHeader = document.getElementById("header" + side);
	this.moveSpeed = socketValues["moveSpeed"];
	this.setTopPosition(socketValues["paddleTopPosition"]);
	this.playerSpells = this.loadPlayerSpells(socketValues["playerSpells"]);
	this.score = 0;
	addSpellsToHeader(this.paddleHeader, this.playerSpells);
	players.push(this);
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

Player.prototype.setPaddleSize = function (size) {
	this.getPaddleStyle().height = size;
}

Player.prototype.displayPoint = function () {
	this.paddleHeader.querySelector(".scorePlayer").textContent = this.score;
}

Player.prototype.loadPlayerSpells = function (spellIdArray) {
	const spells = [];
	spellIdArray.forEach((spell => {
		spells.push(getSpellWithId(spell));
	}));
	return spells;
}

Player.prototype.launchSpell = function (spellId) {
	for (const spell of this.playerSpells) {
		if (spell.spellId === spellId) {
			spell.executor(this);
			break;
		}
	}
}

Player.prototype.increaseScore = function () {
	this.score++;
}

function startPlayerLoop() {
	for (const [key, value] of Object.entries(playerKeys)) {
		if (keyDown.has(value))
			sendMessageToServer("movePlayer", {"direction": key, "clientSide": getClientSide(), "gameId": getGameId()})
	}
	setTimeout(startPlayerLoop, 5);
}

export function getPlayerWithSide(side) {
	return side === "Left" ? players[0] : players[1];
}

export function getClientSide() {
	return clientSide
}

export function setTopPositionToPlayer(socketValues) {
	const targetPlayer = getPlayerWithSide(socketValues["targetPlayer"]);

	targetPlayer.setTopPosition(socketValues["topPosition"]);
}