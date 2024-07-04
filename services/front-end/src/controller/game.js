import {maxScore} from "./settings.js";
import {getLeftPaddle, getRightPaddle, startPlayersLoop} from "./player.js";
import {startBallLoop} from "./ball.js";
import {displayPlayerPoint} from "../view/player_view.js";

export function launchGame() {
	startBallLoop();
	startPlayersLoop();
}

export function isGameEnd() {
	return getRightPaddle().getScore() >= maxScore || getLeftPaddle().getScore() >= maxScore;
}

export function endGame() {

}

export function markPoint(ball, header) {
	ball.deleteBall();
	const scoreHtml = header.querySelector(".scorePlayer");
	displayPlayerPoint(scoreHtml, parseInt(scoreHtml.textContent) + 1);
	if (isGameEnd())
		endGame();
}