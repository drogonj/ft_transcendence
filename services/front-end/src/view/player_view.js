import {moveStep} from "../controller/settings.js";

export function movePlayerPaddleUp(playerPaddle) {
	playerPaddle.style.top = (playerPaddle.offsetTop - moveStep) + "px";
}

export function movePlayerPaddleDown(playerPaddle) {
	playerPaddle.style.top = (playerPaddle.offsetTop + moveStep) + "px";
}