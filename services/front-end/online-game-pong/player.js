import {keyDown} from "./listeners.js";
import {sendMessageToServer} from "./websocket.js";

let player;

export function createPlayer(socketData) {
	player = new Player(socketData);
	player.startPlayerLoop();
}

function Player(socketValues) {
	this.paddleHtml = document.getElementById(socketValues["paddleHtml"]);
	this.paddleHeader = document.getElementById(socketValues["paddleHeader"]);
	this.moveSpeed = socketValues["moveSpeed"];
	this.paddleDirection = socketValues["paddleDirection"];
	this.setTopPosition(socketValues["playerTopPosition"])
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

Player.prototype.displayPoint = function (socketValues) {
	this.paddleHeader.querySelector(".scorePlayer").textContent = socketValues["score"];

}

export function getPlayer() {
	return player;
}