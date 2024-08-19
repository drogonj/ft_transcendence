import {Spell} from "../spell.js";
import {newImage, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getBallsWithIds, getBallWithId} from "../ball.js";

export default function BallFreeze() {
	Spell.call(this, 5, "Ball Freeze", "DESCRIPTION", "ballFreeze", newImage("../../assets/images/ball_freeze.png"));
}

BallFreeze.prototype.executor = function(socketValues) {
	coolDownRun(this);
	const ballInSide = getBallsWithIds(socketValues["ballIds"]);
	ballInSide.forEach((ball) => {
		setCssProperty(ball.getBallStyle(), "background-color", "#72A0C1");
	});
}

BallFreeze.prototype.onHit = function(socketValues) {
	const ball = getBallWithId(socketValues["ballIds"]);
	setCssProperty(ball.getBallStyle(), "background-color", "#DAE1E7");
}
