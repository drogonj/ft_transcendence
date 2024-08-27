import {setSpellDelay, Spell} from "../spell.js";
import {newImage, setCssProperty} from "../game.js";
import {coolDownRun} from "../header.js";
import {getPlayerWithSide} from "../player.js";

export default function PaddleStun() {
	Spell.call(this, 15, "Paddle Stun", "DESCRIPTION", "paddleStun", newImage("../../assets/images/paddle_stun.png"));
}

PaddleStun.prototype.executor = function (socketValues) {
	coolDownRun(this);
	const targetPaddle = getPlayerWithSide(socketValues["targetPlayer"])
	setCssProperty(targetPaddle.getPaddleStyle(), "background-color", "#72A0C1");
    setSpellDelay(2).then(() => {
		setCssProperty(targetPaddle.getPaddleStyle(), "background-color", "#DAE1E7");
    })
}