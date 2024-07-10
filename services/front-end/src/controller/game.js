import {maxScore} from "./settings.js";
import {getLeftPaddle, getRightPaddle, startPlayersLoop} from "./player.js";
import {startBallLoop} from "./ball.js";
import {displayPlayerPoint} from "../view/player_view.js";
import {timerDecrease} from "./header.js";
import {renderPageWithName} from "../model/page.js";
import {displayStatistics} from "../view/statistics_view.js";

export function launchGame() {
	startBallLoop();
	startPlayersLoop();
	startGlobalGameLoop();
}

export function isGameEnd() {
	return getRightPaddle().statistics.getScore() >= maxScore || getLeftPaddle().statistics.getScore() >= maxScore;
}

export function endGame() {
	renderPageWithName("menu-end.html");
	displayStatistics(getLeftPaddle().statistics, getRightPaddle().statistics);
}

export function markPoint(ball, paddle) {
	ball.deleteBall();
	if (getRightPaddle().statistics.getScore() >= maxScore)
		return;
	const scoreHtml = paddle.paddleHeader.querySelector(".scorePlayer");
	paddle.statistics.increaseScore();
	displayPlayerPoint(scoreHtml, paddle.statistics.getScore());
}

function startGlobalGameLoop() {
	if (isGameEnd()) {
		endGame();
		return;
	}
	timerDecrease();
	setTimeout(startGlobalGameLoop, 1000);
}