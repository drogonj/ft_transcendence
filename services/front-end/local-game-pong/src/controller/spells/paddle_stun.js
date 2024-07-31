import {setSpellDelay, Spell} from "../spell.js";
import {getOpponentPaddle} from "../player.js";
import {setCssProperty} from "../../view/style_view.js";
import {newImage} from "../utils/utils.js";

export default function PaddleStun() {
	Spell.call(this, 15, "Paddle Stun", "DESCRIPTION", newImage("../../assets/images/paddle_stun.png"));
}

PaddleStun.prototype = Object.create(Spell.prototype);
PaddleStun.prototype.constructor = PaddleStun;

PaddleStun.prototype.performExecutor = function (playerPaddle) {
	const targetPaddle = getOpponentPaddle(playerPaddle);
	const saveMoveSpeed = targetPaddle.moveStep
    targetPaddle.moveStep = 0;
	setCssProperty(targetPaddle.getPaddleStyle(), "background-color", "#72A0C1");
    setSpellDelay(2).then(() => {
        targetPaddle.moveStep = saveMoveSpeed;
		setCssProperty(targetPaddle.getPaddleStyle(), "background-color", "#DAE1E7");
    })
}