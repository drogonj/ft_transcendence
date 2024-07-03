import {Spell, spellLaunchController} from "../spell.js";
import {getAllBallInSide} from "../ball.js";
import {removeBallProperty, setBallAnimation} from "../../view/ball_view.js";


export default function BallInvisible() {
	Spell.call(this, 5, "Ball Freeze", "TEXT DESCRIPTION");
}

BallInvisible.prototype.executor = function(playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const side = playerPaddle.paddleDirection === 1 ? 0 : 1;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.ballActiveSpell = this;
		setBallAnimation(ball, "makeInvisible 0.2s forwards");
	});
}

BallInvisible.prototype.onHit = function(ball) {
	ball.ballHtml.style.opacity = "1";
	ball.ballActiveSpell = null;
	removeBallProperty(ball, "animation");
}