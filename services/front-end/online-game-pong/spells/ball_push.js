import {Spell} from "../spell.js";
import {newImage, removeCssProperty, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getBallsWithIds, getBallWithId} from "../ball.js";


export default function BallPush() {
	Spell.call(this, 5, "Ball Push", "DESCRIPTION", "ballPush", newImage("../../assets/images/ball_push.png"));
}

BallPush.prototype.executor = function(socketValues) {
	console.log("exectur bullpush");
	coolDownRun(this);
	const ballInSide = getBallsWithIds(socketValues["ballIds"]);
	ballInSide.forEach((ball) => {
		setCssProperty(ball.ballHtml.style, "--change-color1", "#FF0800");
		setCssProperty(ball.ballHtml.style, "--change-color2", "#660000");
		setCssProperty(ball.getBallStyle(), "animation", "changeColor 0.3s linear infinite");
	});
}

BallPush.prototype.onHit = function(socketValues) {
	const ball = getBallWithId(socketValues["ballIds"]);
	/*if (!ball.ballHtml.style.animation.length) {
		ball.ballVx /= 2;
		ball.ballVy /= 2;
		ball.removeActiveSpell();
		return;
	}
	ball.ballVx *= 2;
	ball.ballVy *= 2;*/
	removeCssProperty(ball.getBallStyle(), "animation");
}

BallPush.prototype.destructor = function (socketValues) {
	const ball = getBallWithId(socketValues["ballIds"][0]);
	/*ball.ballVx /= 2;
	ball.ballVy /= 2;*/
	removeCssProperty(ball.getBallStyle(), "animation");
}