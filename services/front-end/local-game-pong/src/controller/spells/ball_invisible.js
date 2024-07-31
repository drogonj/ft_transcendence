import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {removeCssProperty, setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";


export default function BallInvisible() {
	Spell.call(this, 5, "Ball Freeze", "DESCRIPTION", newImage("../../assets/images/ball_invisible.png"));
}

BallInvisible.prototype = Object.create(Spell.prototype);
BallInvisible.prototype.constructor = BallInvisible;

BallInvisible.prototype.performExecutor = function(playerPaddle) {
	const side = playerPaddle.paddleDirection === 1 ? 0 : 1;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.ballActiveSpell = this;
		setCssProperty(ball.getBallStyle(), "animation", "makeInvisible 0.2s forwards");
	});
}

BallInvisible.prototype.onHit = function(ball) {
	ball.ballHtml.style.opacity = "1";
	ball.ballActiveSpell = null;
	removeCssProperty(ball.getBallStyle(), "animation");
}

BallInvisible.prototype.destructor = function(ball) {
	ball.ballHtml.style.opacity = "1";
	removeCssProperty(ball.getBallStyle(), "animation");
}