import {moveStep} from "../controller/settings.js";

export function movePlayerPaddleUp(playerPaddle) {
	playerPaddle.paddleHtml.style.top = (playerPaddle.paddleHtml.offsetTop - moveStep) + "px";
}

export function movePlayerPaddleDown(playerPaddle) {
	playerPaddle.paddleHtml.style.top = (playerPaddle.paddleHtml.offsetTop + moveStep) + "px";
}

export function displayPlayerPoint(scoreHtml, text) {
	scoreHtml.textContent = text;
}