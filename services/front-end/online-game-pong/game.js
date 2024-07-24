import {loadHeader, timerDecrease} from "./header.js";
import loadListeners from "./listeners.js";
import loadMap from "./map.js";

export function launchGame() {
	loadListeners();
	loadMap();
	loadHeader();
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