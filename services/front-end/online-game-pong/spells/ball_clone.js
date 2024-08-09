import {getSpellWithId, Spell} from "../spell.js";
import {newImage} from "../game.js";
import {getBallsWithIds} from "../ball.js";
/*import {copyBall, getAllBallInSide} from "../ball.js";
import {getRandomNumberWithDecimal} from "../utils/math_utils.js";
import {removeCssProperty, setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";*/


export default function BallClone() {
	Spell.call(this, 5, "Ball Clone", "DESCRIPTION", "ballClone", newImage("../../assets/images/ball_clone.png"));
}

BallClone.prototype.executor = function (spell, socketValues) {
	coolDownRun(spell);
	const balls = getBallsWithIds(socketValues["ballIds"]);
	balls.forEach((ball) => {
		setCssProperty(ball.ballHtml.style, "--change-color1", "#483D8B");
		setCssProperty(ball.ballHtml.style, "--change-color2", "#FF00FF");
		setCssProperty(ball.getBallStyle(), "animation", "changeColor 0.2s linear infinite");
	});
}

BallClone.prototype.onHit = function(ball) {
	removeCssProperty(ball.getBallStyle(), "animation");
	const cloneBall = copyBall(ball);
	cloneBall.ballVy = getRandomNumberWithDecimal(0.1, 0.7);
}

BallClone.prototype.destructor = function(ball) {
	removeCssProperty(ball.getBallStyle(), "animation");
}