import {ballStep} from "../controller/settings.js";

export function moveBall(ball) {
	ball.style.left = (ball.offsetLeft - ballStep) + "px";
}

