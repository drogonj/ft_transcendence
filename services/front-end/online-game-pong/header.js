import {setCssProperty} from "./game.js";

let seconds;
let minutes;
let timeHtml;

export function setTextContentToHtmlElement(htmlElement, textContent) {
	htmlElement.textContent = textContent;
}

export function loadHeader() {
	timeHtml = document.getElementById("headerTimer");
	minutes = 2;
	seconds = 0;
}

export function timerDecrease() {
	if (minutes <= 0 && seconds <= 0)
		return;
	if (seconds <= 0) {
		minutes--;
		seconds = 59;
	} else
		seconds--;
	timerDisplay(minutes, seconds, timeHtml);
}

export function coolDownRun(spell) {
	let remindTime = spell.cooldown;
	setCssProperty(spell.spellCoolDownHtml.style, "display", "flex");
	coolDownDisplay(remindTime, spell.spellCoolDownHtml);

	const interval = setInterval(function () {
		if (remindTime <= 1) {
			setCssProperty(spell.spellCoolDownHtml.style, "display", "none");
			clearInterval(interval);
			return;
		}
		remindTime--;
		coolDownDisplay(remindTime, spell.spellCoolDownHtml);
	}, 1000)
}

function timerDisplay(minutes, seconds, timeHtml) {
	if (seconds <= 9)
		seconds = "0" + seconds
	if (minutes <= 9)
		minutes = "0" + minutes
	setTextContentToHtmlElement(timeHtml, minutes + ":" + seconds);
}

export function coolDownDisplay(seconds, spellHtml) {
	spellHtml.textContent = seconds;
}

export function addSpellsToHeader(playerHeader, spells) {
	spells.forEach((spell) => {
		playerHeader.getElementsByClassName("spellContainer")[0].appendChild(spell.spellHtml);
	});
}
