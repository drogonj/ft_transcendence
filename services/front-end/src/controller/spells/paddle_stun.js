import {setSpellDelay, Spell, spellLaunchController} from "../spell.js";
import {getOpponentPaddle} from "../player.js";
import {setCssProperty} from "../../view/style_view.js";

export default function PaddleStun() {
	Spell.call(this, 5, "Paddle Stun", "TEXT DESCRIPTION");
}

PaddleStun.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const targetPaddle = getOpponentPaddle(playerPaddle);
	const saveMoveSpeed = targetPaddle.moveStep
    targetPaddle.moveStep = 0;
	setCssProperty(targetPaddle.getPaddleStyle(), "background-color", "#72A0C1");
    setSpellDelay(2).then(() => {
        targetPaddle.moveStep = saveMoveSpeed;
		setCssProperty(targetPaddle.getPaddleStyle(), "background-color", "#DAE1E7");
    })
}