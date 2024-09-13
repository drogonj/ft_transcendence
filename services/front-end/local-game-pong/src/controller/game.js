import {
	getAllPaddles,
	getLeftPaddle,
	getOpponentPaddle,
	getRightPaddle,
	havePlayersMaxScore,
	startPlayersLoop, stopPlayerLoop
} from "./player.js";
import {startBallLoop, stopBallLoop} from "./ball.js";
import {displayPlayerPoint} from "../view/player_view.js";
import {timerDecrease} from "./header.js";
import {displayStatistics} from "../view/statistics_view.js";
import {navigateTo} from "../../../scripts/contentLoader.js";
import launchAi, {stopAiLoops} from "./ai.js";
import {aiActive} from "./settings.js";
import {friendSocket} from "../../../scripts/friends.js";

let globalLoop;

export function launchGame() {
	stopBallLoop();
	stopPlayerLoop();
	stopAiLoops();
	clearTimeout(globalLoop);
	startBallLoop();
	startPlayersLoop();
	startGlobalGameLoop();
	if (aiActive)
		launchAi();
}

export function isGameEnd() {
	return havePlayersMaxScore();
}

export function endGame() {
	navigateTo("/game-end", true);
	displayStatistics(getLeftPaddle().statistics, getRightPaddle().statistics);
	const message = {
		"in-game": false,
	}
	friendSocket.send(JSON.stringify(message));
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
	globalLoop = setTimeout(startGlobalGameLoop, 1000);
}