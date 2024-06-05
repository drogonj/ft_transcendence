import {keyDown} from "./listeners.js"
import {tickRate, mapHeigth, playerHeight, moveSpeed} from "./settings.js";
import {movePlayerBarUp, movePlayerBarDown} from "../view/player_view.js";

const leftPlayerBar = document.getElementsByClassName("playerBar")[0];

export default function loadPlayer() {
	tick();
}

function tick() {
	if (keyDown['ArrowUp']) {
		if (playerCanMoveUp(leftPlayerBar))
			movePlayerBarUp(leftPlayerBar)
	} else if (keyDown['ArrowDown']) {
		if (playerCanMoveDown(leftPlayerBar))
			movePlayerBarDown(leftPlayerBar);
	}
	setTimeout(tick, tickRate);
}

function playerCanMoveUp(playerBar) {
	return playerBar.offsetTop - moveSpeed > 0;
}

function playerCanMoveDown(playerBar) {
	return (playerBar.offsetTop + playerHeight) + moveSpeed <= mapHeigth;
}