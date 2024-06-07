import {keyDown} from "./listeners.js"
import {moveStep, moveSpeed} from "./settings.js";
import {movePlayerPaddleUp, movePlayerPaddleDown} from "../view/player_view.js";
import {getMapHeight} from "./map.js";

const players = [];

export default function loadPlayers() {
	players.push(new Player(document.getElementsByClassName("playerPaddle")[0]));
	players.push(new Player (document.getElementsByClassName("playerPaddle")[1]));
	tick();
}

function Player(paddleHtml) {
	this.paddleHtml = paddleHtml;
}

Player.prototype.playerCanMoveUp = function() {
	return this.paddleHtml.offsetTop - moveStep > 0;
}

Player.prototype.playerCanMoveDown = function() {
		return (this.paddleHtml.offsetTop + this.paddleHtml.offsetHeight) + moveStep < getMapHeight();
}

function tick() {
	if (keyDown['ArrowUp']) {
		if (getLeftPlayer().playerCanMoveUp())
			movePlayerPaddleUp(getLeftPlayer())
	} else if (keyDown['ArrowDown']) {
		if (getLeftPlayer().playerCanMoveDown())
			movePlayerPaddleDown(getLeftPlayer());
	}
	setTimeout(tick, moveSpeed);
}

export function getLeftPlayer() {
	return players[0];
}