import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {removeCssProperty, setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";


export default function BallPush() {
	Spell.call(this, 5, "Ball Push", "DESCRIPTION", newImage("../../assets/images/ball_push.png"));
}

BallPush.prototype = Object.create(Spell.prototype);
BallPush.prototype.constructor = BallPush;

BallPush.prototype.performExecutor = function(playerPaddle) {
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		setCssProperty(ball.ballHtml.style, "--change-color1", "#FF0800");
		setCssProperty(ball.ballHtml.style, "--change-color2", "#660000");
		setCssProperty(ball.getBallStyle(), "animation", "changeColor 0.3s linear infinite");
		ball.setActiveSpell(this);
	});
}

BallPush.prototype.onHit = function(ball) {
	if (!ball.ballHtml.style.animation.length) {
		ball.ballVx /= 2;
		ball.ballVy /= 2;
		ball.removeActiveSpell();
		return;
	}
	ball.ballVx *= 2;
	ball.ballVy *= 2;
	removeCssProperty(ball.getBallStyle(), "animation");
}

BallPush.prototype.destructor = function (ball) {
	ball.ballVx /= 2;
	ball.ballVy /= 2;
	removeCssProperty(ball.getBallStyle(), "animation");
}