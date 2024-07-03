import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {setBallAnimation, setBallStyleProperty} from "../../view/ball_view.js";


export default function BallSlayer() {
	Spell.call(this, 1, "Ball Slayer", "TEXT DESCRIPTION");
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
	setBallStyleProperty(ball, "--change-color1", "#660000");
	setBallStyleProperty(ball, "--change-color2", "#FF0800");
	setBallAnimation(ball, "changeColorWithOpacity " + animationTime + "s forwards")
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, animationTime * 1000);
	})
}