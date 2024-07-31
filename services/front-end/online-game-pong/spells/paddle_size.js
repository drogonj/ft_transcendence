import {Spell, spellLaunchController} from "../spell.js";
import {newImage} from "../game.js";
/*import {getOpponentPaddle} from "../player.js";
import {setPaddleSize} from "../../view/player_view.js";
import {newImage} from "../utils/utils.js";
import {removeCssProperty, setCssProperty} from "../../view/style_view.js";*/

export default function PaddleSize() {
	Spell.call(this, 17, "Paddle Size", "DESCRIPTION", "paddleSize", newImage("../../assets/images/paddle_size.png"));
}

PaddleSize.prototype.executor = function (playerPaddle) {
	if (!spellLaunchController(this))
		return;
	const targetPaddle = getOpponentPaddle(playerPaddle);
	this.animation(targetPaddle).then(() => {
		this.destructor(targetPaddle);
	});
	/*setSpellDelay(4).then(() => {
		setPaddleSize(targetPaddle, savePaddleHeight);
	})*/
}

PaddleSize.prototype.animation = function(paddle) {
	const animationTime = 6;
	const savePaddleHeight = paddle.getPaddleHeight();
	setPaddleSize(paddle, savePaddleHeight / 2);

	setCssProperty(paddle.getPaddleStyle(), "--var1", paddle.getPaddleHeight() + "%");
	setCssProperty(paddle.getPaddleStyle(), "--var2", savePaddleHeight + "%");
	setCssProperty(paddle.getPaddleStyle(), "animation", "heightGrow " + animationTime + "s forwards");
	setCssProperty(paddle.getPaddleStyle(), "background-color", "#F0E68C");
	return new Promise((resolve) => {
		setTimeout(() => {
			setPaddleSize(paddle, savePaddleHeight);
			resolve("success")
		}, animationTime * 1000);
	})
}

PaddleSize.prototype.destructor = function (paddle) {
	setCssProperty(paddle.getPaddleStyle(), "background-color", "#DAE1E7");
	removeCssProperty(paddle.getPaddleStyle(), "animation");
}