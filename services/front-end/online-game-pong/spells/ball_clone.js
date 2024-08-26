import {Spell} from "../spell.js";
import {newImage, removeCssProperty, setCssProperty} from "../game.js";
import {getBallsWithIds, getBallWithId} from "../ball.js";
import {coolDownRun} from "../header.js";


export default function BallClone() {
	Spell.call(this, 5, "Ball Clone", "DESCRIPTION", "ballClone", newImage("../../assets/images/ball_clone.png"));
}

BallClone.prototype.executor = function (socketValues) {
	coolDownRun(this);
	const balls = getBallsWithIds(socketValues["ballIds"]);
	balls.forEach((ball) => {
		setCssProperty(ball.ballHtml.style, "--change-color1", "#483D8B");
		setCssProperty(ball.ballHtml.style, "--change-color2", "#FF00FF");
		setCssProperty(ball.getBallStyle(), "animation", "changeColor 0.2s linear infinite");
	});
}

BallClone.prototype.onHit = function(socketValues) {
	const ball = getBallWithId(socketValues["ballIds"]);
	removeCssProperty(ball.getBallStyle(), "animation");
}

BallClone.prototype.destructor = function(socketValues) {
	const ball = getBallWithId(socketValues["ballIds"]);
	removeCssProperty(ball.getBallStyle(), "animation");
}