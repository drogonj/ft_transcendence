import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils.js";


export default function BallFreeze() {
	Spell.call(this, 5, "Ball Freeze", "DESCRIPTION", newImage("../../assets/images/ball_freeze.png"));
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
		setCssProperty(ball.getBallStyle(), "background-color", "#72A0C1");
	});
}

BallFreeze.prototype.onHit = function(ball) {
	setCssProperty(ball.getBallStyle(), "background-color", "#DAE1E7");
	ball.ballActiveSpell = null;
}