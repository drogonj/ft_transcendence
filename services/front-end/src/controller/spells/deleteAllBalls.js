import {Spell} from "../spell.js";
import {getAllBallInSide} from "../ball.js";


export default function DeleteAllBalls() {
	Spell.call(this, 8, "deleteAllBalls", "none");
}

DeleteAllBalls.prototype.executor = function (playerPaddle) {
	const side = playerPaddle.paddleDirection === 1 ? 1 : 0;
	let ballInSide = getAllBallInSide(side)
	ballInSide.forEach((ball) => {
		ball.deleteBall();
	});
}