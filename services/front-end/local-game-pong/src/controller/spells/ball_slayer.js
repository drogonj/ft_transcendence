import {Spell} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";


export default function BallSlayer() {
	Spell.call(this, 10, "Ball Slayer", "right", "DESCRIPTION", newImage("../../assets/images/ball_slayer.png"));
}

BallSlayer.prototype = Object.create(Spell.prototype);
BallSlayer.prototype.constructor = BallSlayer;

BallSlayer.prototype.performExecutor = function (playerPaddle) {
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
	setCssProperty(ball.getBallStyle(), "--change-color1", "#660000");
	setCssProperty(ball.getBallStyle(), "--change-color2", "#FF0800");
	setCssProperty(ball.getBallStyle(), "animation", "changeColorWithOpacity " + animationTime + "s forwards");
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, animationTime * 1000);
	})
}