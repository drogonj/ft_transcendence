import {Spell} from "../spell.js";
import {newImage, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getBallsWithIds} from "../ball.js";

export default function BallSlayer() {
	Spell.call(this, 10, "Ball Slayer", "All the incoming balls will be removed.", "ballSlayer", newImage("../../assets/images/ball_slayer.png"));
}

BallSlayer.prototype.executor = function (socketValues) {
	coolDownRun(this);
	const ballInSide = getBallsWithIds(socketValues["ballIds"]);
	ballInSide.forEach((ball) => {
		this.animation(ball).then(() => {
			ball.deleteBall();
		})
	});
}

BallSlayer.prototype.animation = function(ball) {
	const animationTime = 1;
	setCssProperty(ball.getBallStyle(), "--change-color1", "#660000");
	setCssProperty(ball.getBallStyle(), "--change-color2", "#FF0800");
	setCssProperty(ball.getBallStyle(), "animation", "changeColorWithOpacity " + animationTime + "s forwards");
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, animationTime * 1000);
	})
}