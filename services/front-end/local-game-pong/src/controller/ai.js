import {getBallWithIndex} from "./ball.js";
import {getRightPaddle} from "./player.js";
import {movePlayerPaddleDown, movePlayerPaddleUp} from "../view/player_view.js";
import {aiDifficulty} from "./settings.js";

let ballPosition;
let ballVelocity;
let paddle;
let moveToDo;
let direction;

export default function launchAi() {
	paddle = getRightPaddle();
	startAiLoop();
	triggerAIKeys();
}

export function startAiLoop() {
	ballPosition = getBallWithIndex(0).getBallPosition();
	ballVelocity = getBallWithIndex(0).getBallVelocity();
	if (ballVelocity[0] < 0) {
		getBallTraj();
	}
	setTimeout(startAiLoop, 1000 * aiDifficulty);
}

export function triggerAIKeys() {
	if (moveToDo <= 0)
		return;
	if (direction === 0) {
		if (paddle.paddleCanMoveUp())
			movePlayerPaddleUp(paddle);
	} else {
		if (paddle.paddleCanMoveDown())
			movePlayerPaddleDown(paddle);
	}
	moveToDo--;
	setTimeout(triggerAIKeys, 10);
}

function getBallTraj() {
	console.log("Try to find");
	ballPosition = getBallWithIndex(0).getBallPosition();
	ballVelocity = getBallWithIndex(0).getBallVelocity();
	while(ballPosition[0] < 97) {
		ballPosition[0] -= ballVelocity[0];
		ballPosition[1] -= ballVelocity[1];
		if (ballPosition[1] <= 0 || ballPosition[1] >= 97) {
			ballVelocity[1] = -ballVelocity[1]
		}
	}
	console.log("Position where will come: ", ballPosition[0], ballPosition[1]);
}