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
		"spell0": "Digit1",
		"spell1": "Digit2",
		"spell2": "Digit3",
		"spell3": "Digit4"
}

export function createPlayers(socketValues) {
	clientSide = socketValues["clientSide"];
	new Player(socketValues["playerLeft"], "Left");
	new Player(socketValues["playerRight"], "Right");
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

Player.prototype.launchSpell = function (socket_values) {
	for (const spell of this.playerSpells) {
		if (spell.spellId === socket_values["spellId"]) {
			if (socket_values["spellAction"] === "executor")
				spell.executor(this);
			else if (socket_values["spellAction"] === "onHit")
				spell.onHit(this);
			else if (socket_values["spellAction"] === "destructor")
				spell.destructor(this);
			break;
		}
	}
}

Player.prototype.increaseScore = function () {
	this.score++;
}

Player.prototype.getPlayerSpellWithId = function (spellId) {
	for (const spell of this.playerSpells) {
		if (spell.spellId === spellId)
			return spell;
	}
}

function startPlayerLoop() {
	for (const [key, value] of Object.entries(playerKeys)) {
		if (keyDown.has(value)) {
			if (key.includes("move"))
				sendMessageToServer("movePlayer", {"direction": key, "clientSide": getClientSide(), "gameId": getGameId()})
			else
				sendMessageToServer("launchSpell", {"playerSide": clientSide, "spellNumber": key.charAt(key.length - 1), "gameId": getGameId()})
		}
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

export function getPlayersSpellWithId(spellId) {
	for (const player of players) {
		const spell = player.getPlayerSpellWithId(spellId);
		if (spell)
			return spell;
	}
}