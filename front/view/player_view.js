import {moveSpeed} from "../controller/settings.js";

export function movePlayerBarUp(playerBar) {
	playerBar.style.top = (playerBar.offsetTop - moveSpeed) + "px";
}

export function movePlayerBarDown(playerBar) {
	playerBar.style.top = (playerBar.offsetTop + moveSpeed) + "px";
}