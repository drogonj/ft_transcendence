import {keyDown} from "./listeners.js";
import {sendMessageToServer} from "./websocket.js";

let player;

export function createPlayer(socketData) {
	player = new Player(socketData);
	player.startPlayerLoop();
}

function Player(socketData) {
	this.paddleHtml = document.getElementById(socketData.values["paddleHtml"]);
	this.paddleHeader = document.getElementById(socketData.values["paddleHeader"]);
	this.moveSpeed = socketData.values["moveSpeed"];
	this.paddleDirection = socketData.values["paddleDirection"];
	this.setTopPosition(socketData.values["playerTopPosition"])
	this.playerKeys = this.definePlayerKeys()
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


Player.prototype.startPlayerLoop = function () {
	for (const [key, value] of Object.entries(this.playerKeys)) {
		if (keyDown.has(value))
			sendMessageToServer(key)
	}
	setTimeout(this.startPlayerLoop.bind(this), this.moveSpeed);
}

Player.prototype.definePlayerKeys = function () {
	return {
		"moveUp": "KeyW",
		"moveDown": "KeyS",
		"spell1": "Digit1",
		"spell2": "Digit2",
		"spell3": "Digit3",
		"spell4": "Digit4"
	};
}

export function getPlayer() {
	return player;
}