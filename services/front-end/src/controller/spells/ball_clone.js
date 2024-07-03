import {Spell, spellLaunchController} from "../spell.js";
import {copyBall, createNewBall, getAllBallInSide} from "../ball.js";
import {displayBall, removeBallProperty, setBallAnimation} from "../../view/ball_view.js";
import {getRandomNumberBetweenOne, getRandomNumberWithDecimal} from "../math_utils.js";


export default function BallClone() {
	Spell.call(this, 5, "Ball Slayer", "TEXT DESCRIPTION");
}

BallClone.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		setBallAnimation(ball, "changeColorTmp2 0.2s linear infinite");
		ball.ballActiveSpell = this;
	});
}

BallClone.prototype.onHit = function(ball) {
	removeBallProperty(ball, "animation");
	ball.ballActiveSpell = null;
	const cloneBall = copyBall(ball);
	cloneBall.ballVy = getRandomNumberWithDecimal(0.1, 0.7);
}