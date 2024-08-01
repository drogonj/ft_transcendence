import {
	getAllPaddles,
	getLeftPaddle,
	getOpponentPaddle,
	getRightPaddle,
	havePlayersMaxScore,
	startPlayersLoop
} from "./player.js";
import {startBallLoop} from "./ball.js";
import {displayPlayerPoint} from "../view/player_view.js";
import {timerDecrease} from "./header.js";
import {displayStatistics} from "../view/statistics_view.js";
import {renderPageWithName} from "../../../scripts/page.js";


export function launchGame() {
	startBallLoop();
	startPlayersLoop();
	startGlobalGameLoop();
}

export function isGameEnd() {
	return havePlayersMaxScore();
}

export function endGame() {
	renderPageWithName("menu-end.html");
	displayStatistics(getLeftPaddle().statistics, getRightPaddle().statistics);
}

export function markPoint(ball, paddle) {
	ball.deleteBall();
	if (havePlayersMaxScore())
		return endGame();
	const scoreHtml = paddle.paddleHeader.querySelector(".scorePlayer");
	const opponentPaddle = getOpponentPaddle(paddle);
	paddle.getStatistics().increaseScore();
	paddle.getStatistics().increaseGoalsInARow();
	opponentPaddle.getStatistics().resetTimeWithoutTakingGoals();
	opponentPaddle.getStatistics().resetGoalsInARow();
	displayPlayerPoint(scoreHtml, paddle.statistics.getScore());
}

function startGlobalGameLoop() {
	if (isGameEnd()) {
		endGame();
		return;
	}
	for (const player of getAllPaddles())
		player.getStatistics().increaseTimeWithoutTakingGoals()
	timerDecrease();
	setTimeout(startGlobalGameLoop, 1000);
}