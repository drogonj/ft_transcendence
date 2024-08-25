import {getPlayerWithSide} from "./player.js";

export function displayStatistics(socketValues) {
	createDivs(socketValues.Left, document.getElementById("leftPlayer"));
	createDivs(socketValues.Right, document.getElementById("rightPlayer"));

	const leftPlayer = getPlayerWithSide("Left");
	document.getElementsByClassName("playerNameEnd")[0].textContent = leftPlayer.user.username
	document.getElementsByClassName("playerAvatarEnd")[0].src = leftPlayer.user.avatar

	const rightPlayer = getPlayerWithSide("Right");
	document.getElementsByClassName("playerNameEnd")[1].textContent = rightPlayer.user.username
	document.getElementsByClassName("playerAvatarEnd")[1].src = rightPlayer.user.avatar
}

function createDivs(stats, htmlElement) {
	stats.forEach((stat) => {
		const div = document.createElement("div");
		div.textContent = stat;
		htmlElement.appendChild(div);
	})
}