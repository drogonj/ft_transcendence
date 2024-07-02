import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {removeBallProperty, setBallAnimation, setBallColor} from "../../view/ball_view.js";


export default function BallPush() {
	Spell.call(this, 5, "Ball Push", "TEXT DESCRIPTION");
}

BallPush.prototype.executor = function(playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.ballActiveSpell = this;
		setBallAnimation(ball, "changeColorTmp 0.3s linear infinite");
	});
}

BallPush.prototype.onHit = function(ball) {
	if (!ball.ballHtml.style.animation.length) {
		ball.ballVx /= 2;
		ball.ballVy /= 2;
		ball.ballActiveSpell = null;
		return;
	}
	ball.ballVx *= 2;
	ball.ballVy *= 2;
	removeBallProperty(ball, "animation");
}