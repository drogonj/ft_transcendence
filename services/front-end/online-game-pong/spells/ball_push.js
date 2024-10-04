import {Spell} from "../spell.js";
import {newImage, removeCssProperty, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getBallsWithIds, getBallWithId} from "../ball.js";

export default function BallPush() {
	Spell.call(this, 5, "Ball Push", "The speed of the next ball you hit increase by 2.", "ballPush", newImage("../../assets/images/ball_push.png"));
}

BallPush.prototype.executor = function(socketValues) {
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
	removeCssProperty(ball.getBallStyle(), "animation");
}
