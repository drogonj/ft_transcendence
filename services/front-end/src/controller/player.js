import {keyDown} from "./listeners.js"
import { moveStep, moveSpeed} from "./settings.js";
import {movePlayerPaddleUp, movePlayerPaddleDown} from "../view/player_view.js";
import {getMapHeight} from "./map.js";

const players = [];
let playerHeight;

export default function loadPlayers() {
	players.push(document.getElementsByClassName("playerPaddle")[0]);
	players.push(document.getElementsByClassName("playerPaddle")[1]);
	playerHeight = players[0].offsetHeight;
	tick();
}

function tick() {
	if (keyDown['ArrowUp']) {
		if (playerCanMoveUp(getLeftPlayer()))
			movePlayerPaddleUp(getLeftPlayer())
	} else if (keyDown['ArrowDown']) {
		if (playerCanMoveDown(getLeftPlayer()))
			movePlayerPaddleDown(getLeftPlayer());
	}
	setTimeout(tick, moveSpeed);
}

function playerCanMoveUp(playerPaddle) {
	return playerPaddle.offsetTop - moveStep > 0;
}

function playerCanMoveDown(playerPaddle) {
	return (playerPaddle.offsetTop + playerHeight) + moveStep < getMapHeight();
}

export function getLeftPlayer() {
	return players[0];
}