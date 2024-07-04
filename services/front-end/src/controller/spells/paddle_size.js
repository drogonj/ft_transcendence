import {setSpellDelay, Spell, spellLaunchController} from "../spell.js";
import {getOpponentPaddle} from "../player.js";
import {setPaddleSize} from "../../view/player_view.js";
import {newImage} from "../utils.js";

export default function PaddleSize() {
	Spell.call(this, 5, "Paddle Size", "DESCRIPTION", newImage("../../assets/images/paddle_size.png"));
}

PaddleSize.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const targetPaddle = getOpponentPaddle(playerPaddle);
	const savePaddleHeight = targetPaddle.getPaddleHeight();
	setPaddleSize(targetPaddle, savePaddleHeight / 2);
	setSpellDelay(4).then(() => {
		setPaddleSize(targetPaddle, savePaddleHeight);

	})
}