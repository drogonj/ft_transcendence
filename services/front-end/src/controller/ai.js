import { players } from "./player.js";
import { moveStep } from "./settings.js";
import {getMapHeight} from "./map.js";
import {AI, getAIPaddle} from "./ai.js";
import {movePlayerPaddleUp} from "../view/player_view";

export function getAIHeader() {
	return players[1].paddleHeader;
}

export function getAIPaddle() {
	return players[1];
}

export function AI(paddleHtml, paddleDirection, paddleHeader) {
	this.paddleHtml = paddleHtml;
	this.paddleHeader = paddleHeader;
	this.paddleDirection = paddleDirection;
}

AI.prototype.paddleCanMoveUp = function() {
	return this.paddleHtml.offsetTop - moveStep > 0;
}

AI.prototype.paddleCanMoveDown = function() {
		return (this.paddleHtml.offsetTop + this.paddleHtml.offsetHeight) + moveStep < getMapHeight();
}

export function moveAIPaddle() {
	const aiPaddle = getAIPaddle();
	//const ballPosition = getBall().ballHtml.offsetTop;

	if (aiPaddle.paddleHtml.offsetTop + aiPaddle.paddleHtml.offsetHeight / 2 < ballPosition) {
		if (aiPaddle.paddleCanMoveDown())
			movePlayerPaddleUp(aiPaddle);
	} else {
		if (aiPaddle.paddleCanMoveUp())
			movePlayerPaddleUp(aiPaddle);
	}
}
