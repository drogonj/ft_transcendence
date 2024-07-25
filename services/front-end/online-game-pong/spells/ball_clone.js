import {Spell, spellLaunchController} from "../spell.js";
import {copyBall, getAllBallInSide} from "../ball.js";
import {getRandomNumberWithDecimal} from "../utils/math_utils.js";
import {removeCssProperty, setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";


export default function BallClone() {
	Spell.call(this, 5, "Ball Clone", "DESCRIPTION", newImage("../../assets/images/ball_clone.png"));
}

BallClone.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		setCssProperty(ball.ballHtml.style, "--change-color1", "#483D8B");
		setCssProperty(ball.ballHtml.style, "--change-color2", "#FF00FF");
		setCssProperty(ball.getBallStyle(), "animation", "changeColor 0.2s linear infinite");
		ball.setActiveSpell(this);
	});
}

BallClone.prototype.onHit = function(ball) {
	removeCssProperty(ball.getBallStyle(), "animation");
	ball.removeActiveSpell();
	const cloneBall = copyBall(ball);
	cloneBall.ballVy = getRandomNumberWithDecimal(0.1, 0.7);
}

BallClone.prototype.destructor = function(ball) {
	removeCssProperty(ball.getBallStyle(), "animation");
}