import {Spell} from "../spell.js";
import {newImage, removeCssProperty, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getBallsWithIds, getBallWithId} from "../ball.js";


export default function BallInvisible() {
	Spell.call(this, 5, "Ball Invisible", "DESCRIPTION", "ballInvisible", newImage("../../assets/images/ball_invisible.png"));
}

BallInvisible.prototype.executor = function(socketValues) {
	coolDownRun(this);
	const ballInSide = getBallsWithIds(socketValues["ballIds"]);
	ballInSide.forEach((ball) => {
		setCssProperty(ball.getBallStyle(), "animation", "makeInvisible 0.2s forwards");
	});
}

BallInvisible.prototype.onHit = function(socketValues) {
	const ball = getBallWithId(socketValues["ballIds"]);
	ball.ballHtml.style.opacity = "1";
	removeCssProperty(ball.getBallStyle(), "animation");
}

BallInvisible.prototype.destructor = function(socketValues) {
	const ball = getBallWithId(socketValues["ballIds"]);
	ball.ballHtml.style.opacity = "1";
	removeCssProperty(ball.getBallStyle(), "animation");
}