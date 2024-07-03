import {Spell, spellLaunchController} from "../spell.js";
import {copyBall, createNewBall, getAllBallInSide} from "../ball.js";
import {displayBall, removeBallProperty, setBallAnimation, setBallStyleProperty} from "../../view/ball_view.js";
import {getRandomNumberBetweenOne, getRandomNumberWithDecimal} from "../math_utils.js";
import {setPropertyColor} from "../../view/global_style_view.js";


export default function BallClone() {
	Spell.call(this, 5, "Ball Slayer", "TEXT DESCRIPTION");
}

BallClone.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		setBallStyleProperty(ball, "--change-color1", "#483D8B");
		setBallStyleProperty(ball, "--change-color2", "#FF00FF");
		setBallAnimation(ball, "changeColor 0.2s linear infinite");
		ball.ballActiveSpell = this;
	});
}

BallClone.prototype.onHit = function(ball) {
	//removeBallProperty(ball, "animation");
	ball.ballActiveSpell = null;
	const cloneBall = copyBall(ball);
	cloneBall.ballVy = getRandomNumberWithDecimal(0.1, 0.7);
}