import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {removeBallProperty, setBallAnimation, setBallColor, setBallStyleProperty} from "../../view/ball_view.js";
import {getPropertyColor, setPropertyColor} from "../../view/global_style_view.js";


export default function BallPush() {
	Spell.call(this, 5, "Ball Push", "TEXT DESCRIPTION");
}

BallPush.prototype.executor = function(playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		setBallStyleProperty(ball, "--change-color1", "#FF0800");
		setBallStyleProperty(ball, "--change-color2", "#660000");
		ball.ballActiveSpell = this;
		setBallAnimation(ball, "changeColor 0.3s linear infinite");
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