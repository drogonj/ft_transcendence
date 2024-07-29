import {Spell, spellLaunchController} from "../spell.js";
import {newImage, setCssProperty} from "../game.js";
/*import {getAllBallInSide} from "../ball.js";
import {setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";*/


export default function BallFreeze() {
	Spell.call(this, 5, "Ball Freeze", "DESCRIPTION", "ballFreeze", newImage("../../assets/images/ball_freeze.png"));
}

BallFreeze.prototype.executor = function(spellValues) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.setActiveSpell(this);
		ball.ballVx /= 3;
		ball.ballVy /= 3;
		setCssProperty(ball.getBallStyle(), "background-color", "#72A0C1");
	});
}

BallFreeze.prototype.onHit = function(ball) {
	setCssProperty(ball.getBallStyle(), "background-color", "#DAE1E7");
	ball.removeActiveSpell();
}

BallFreeze.prototype.destructor = function(ball) {
	setCssProperty(ball.getBallStyle(), "background-color", "#DAE1E7");
	ball.ballVx *= 3;
	ball.ballVy *= 3;
}