import {moveStep} from "../controller/settings.js";

export function movePlayerBarUp(playerBar) {
	playerBar.style.top = (playerBar.offsetTop - moveStep) + "px";
}

export function movePlayerBarDown(playerBar) {
	playerBar.style.top = (playerBar.offsetTop + moveStep) + "px";
}