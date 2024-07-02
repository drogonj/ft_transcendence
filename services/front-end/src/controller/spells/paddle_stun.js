import {setSpellDelay, Spell, spellLaunchController} from "../spell.js";
import {getOpponentPaddle} from "../player.js";
import {setPaddleColor} from "../../view/player_view.js";

export default function PaddleStun() {
	Spell.call(this, 5, "Paddle Stun", "TEXT DESCRIPTION");
}

PaddleStun.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const targetPaddle = getOpponentPaddle(playerPaddle);
	const saveMoveSpeed = targetPaddle.moveStep
    targetPaddle.moveStep = 0;
	setPaddleColor(targetPaddle, "#72A0C1");
    setSpellDelay(2).then(() => {
        targetPaddle.moveStep = saveMoveSpeed;
        setPaddleColor(targetPaddle, "#DAE1E7");
    })
}