import {loadHeader, timerDecrease} from "./header.js";
import loadListeners from "./listeners.js";
import loadMap from "./map.js";
import {createBall} from "./ball.js";

export function launchGame(socketValues) {
	loadListeners();
	loadMap();
	loadHeader();
	createBall(socketValues);
	startGlobalGameLoop();
}

/*export function isGameEnd() {
	return havePlayersMaxScore();
}

export function endGame() {
	renderPageWithName("menu-end.html");
	displayStatistics(getLeftPaddle().statistics, getRightPaddle().statistics);
}*/

function startGlobalGameLoop() {
	/*if (isGameEnd()) {
		endGame();
		return;
	}*/
	timerDecrease();
	setTimeout(startGlobalGameLoop, 1000);
}