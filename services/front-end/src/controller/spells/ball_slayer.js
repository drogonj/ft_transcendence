import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";


export default function BallSlayer() {
	Spell.call(this, 5, "Ball Slayer", "TEXT DESCRIPTION");
}

BallSlayer.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.ballVx = 0;
		ball.ballVy = 0;
		this.animation(ball).then(() => {
			ball.deleteBall();
		})
	});
}

BallSlayer.prototype.animation = function(ball) {
	const animationTime = 1;
	ball.ballHtml.style.animation = "changeColor " + animationTime + "s";
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, animationTime * 1000);
	})
}