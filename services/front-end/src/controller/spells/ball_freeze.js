import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {setBallColor} from "../../view/ball_view.js";


export default function BallFreeze() {
	Spell.call(this, 5, "Ball Freeze", "TEXT DESCRIPTION");
}

BallFreeze.prototype.executor = function(playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.ballActiveSpell = this;
		ball.ballVx /= 3;
		ball.ballVy /= 3;
		setBallColor(ball, "#72A0C1");
	});
}

BallFreeze.prototype.onHit = function(ball) {
	setBallColor(ball, "#DAE1E7");
	ball.ballActiveSpell = null;
}