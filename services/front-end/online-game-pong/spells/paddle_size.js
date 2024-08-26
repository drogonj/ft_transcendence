import {Spell} from "../spell.js";
import {newImage, removeCssProperty, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getPlayerWithSide} from "../player.js";

export default function PaddleSize() {
	Spell.call(this, 17, "Paddle Size", "DESCRIPTION", "paddleSize", newImage("../../assets/images/paddle_size.png"));
}

PaddleSize.prototype.executor = function (socketValues) {
	coolDownRun(this);
	const targetPaddle = getPlayerWithSide(socketValues["playerTarget"])
	this.animation(targetPaddle).then(() => {
		this.destructor(targetPaddle);
	});
}

PaddleSize.prototype.animation = function(paddle) {
	const animationTime = 5;
	paddle.setPaddleSize(10);

	setCssProperty(paddle.getPaddleStyle(), "--var1", 10 + "%");
	setCssProperty(paddle.getPaddleStyle(), "--var2", 20 + "%");
	setCssProperty(paddle.getPaddleStyle(), "animation", "heightGrow " + animationTime + "s forwards");
	setCssProperty(paddle.getPaddleStyle(), "background-color", "#F0E68C");
	return new Promise((resolve) => {
		setTimeout(() => {
			paddle.setPaddleSize(20);
			resolve("success")
		}, animationTime * 1000);
	})
}

PaddleSize.prototype.destructor = function (paddle) {
	setCssProperty(paddle.getPaddleStyle(), "background-color", "#DAE1E7");
	removeCssProperty(paddle.getPaddleStyle(), "animation");
}