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
import {addSpellsToHeader} from "../view/header_view.js";*/

import loadListeners, {keyDown} from "./listeners.js";
import {sendMessageToServer} from "./websocket.js";

let player;

export default function createPlayer(socketData) {
	player = new Player(socketData);
	loadListeners();
	player.startPlayersLoop();
}

function Player(socketData) {
	this.paddleHtml = document.getElementById(socketData.values["paddleHtml"]);
	this.paddleHeader = document.getElementById(socketData.values["paddleHeader"]);
	this.moveSpeed = socketData.values["moveSpeed"];
	this.moveStep = 1;
	this.paddleDirection = socketData.values["paddleDirection"];
	this.setTopPosition(socketData.values["playerTopPosition"])
	this.playerKeys = this.definePlayerKeys()
	//this.playerSpells = getSpells(paddleDirection);
	//this.statistics = new Statistics();
	this.setPaddleSize(socketData.values["paddleSize"]);
	//addSpellsToHeader(this.paddleHeader, this.playerSpells);
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


Player.prototype.startPlayersLoop = function () {
	for (const [key, value] of Object.entries(this.playerKeys)) {
		if (keyDown.has(value))
			sendMessageToServer(key)
	}
	setTimeout(this.startPlayersLoop.bind(this), this.moveSpeed);
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

/*

class Player:
	def __init__(self, ws):
		self.__socket = ws
		self.__top_position = 20
		self.__paddle_size = 20
		self.__move_speed = 5

	def send_message_to_client(self, message):
		self.__socket.write_message(message)
 */