import {maxScore} from "./settings.js";
import {getLeftPaddle, getRightPaddle, startPlayersLoop} from "./player.js";
import {startBallLoop} from "./ball.js";
import {displayPlayerPoint} from "../view/player_view.js";
import {startHeaderLoop} from "./header.js";
import {renderPageWithName} from "../model/page.js";

export function launchGame() {
	startBallLoop();
	startPlayersLoop();
	startHeaderLoop();
}

export function isGameEnd() {
	return getRightPaddle().getScore() >= maxScore || getLeftPaddle().getScore() >= maxScore;
}

export function endGame() {
	renderPageWithName("menu-end.html");
}

export function markPoint(ball, header) {
	ball.deleteBall();
	const scoreHtml = header.querySelector(".scorePlayer");
	displayPlayerPoint(scoreHtml, parseInt(scoreHtml.textContent) + 1);
	if (isGameEnd())
		endGame();
}