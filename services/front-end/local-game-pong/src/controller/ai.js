import {getBallWithIndex} from "./ball.js";
import {getRightPaddle} from "./player.js";
import {movePlayerPaddleDown, movePlayerPaddleUp} from "../view/player_view.js";
import {spellsActive} from "./settings.js";

let ballPosition;
let ballVelocity;
let paddle;
let targetPosition;
let aiLoop;
let aiLoopKey;

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
	aiLoop = setTimeout(startAiLoop, 1000);
}

export function triggerAIKeys() {
	let direction = paddle.playerTopPosition < targetPosition ? 1 : 0;
	if (paddle.playerTopPosition + 2 > targetPosition && paddle.playerTopPosition - 2 < targetPosition) {
		direction = -1;
	}

	if (direction === 0) {
		if (paddle.paddleCanMoveUp())
			movePlayerPaddleUp(paddle);
	} else if (direction === 1) {
		if (paddle.paddleCanMoveDown())
			movePlayerPaddleDown(paddle);
	}

	if (spellsActive && Math.floor(Math.random() * 200) === 0) {
		const spell = getRandomSpell();
		const ball = getBallWithIndex(0);
		if (ball && spell.canBeLaunchOnTargetBall(ball) && ball.ballActiveSpell === null)
			spell.executor(paddle);
	}

	aiLoopKey = setTimeout(triggerAIKeys, 10);
}

function getBallTraj() {
	const ballPosition = getBallWithIndex(0).getBallPosition();
	const ballVelocity = getBallWithIndex(0).getBallVelocity();
	while(ballPosition[0] < 97) {
		ballPosition[0] -= ballVelocity[0];
		ballPosition[1] -= ballVelocity[1];
		if (ballPosition[1] <= 0 || ballPosition[1] >= 97) {
			ballVelocity[1] = -ballVelocity[1]
		}
	}
	targetPosition = ballPosition[1] - paddle.getPaddleHeight() / 2;
}


function getRandomSpell() {
	const randomNumber = Math.floor(Math.random() * paddle.playerSpells.length);
	return paddle.playerSpells[randomNumber];
}

export function stopAiLoops() {
	clearTimeout(aiLoop);
	clearTimeout(aiLoopKey);
}