import {maxTime} from "./settings.js";
import {coolDownDisplay, timerDisplay} from "../view/header_view.js";
import {setCssProperty} from "../view/style_view.js";

let seconds;
let minutes;
let timeHtml;
let headerLoop;

export function loadHeader() {
	seconds = 0
	minutes = maxTime;
	timeHtml = document.getElementById("headerTimer");
}

export function timerDecrease() {
	if (seconds <= 0) {
		minutes--;
		seconds = 59;
	} else
		seconds--;
	if (minutes <= 0 && seconds <= 0)
		return;
	timerDisplay(minutes, seconds, timeHtml);
}

export function coolDownRun(spell) {
	spell.isOnCooldown = true;
	let remindTime = spell.cooldown;
	setCssProperty(spell.spellCoolDownHtml.style, "display", "flex");
	coolDownDisplay(remindTime, spell.spellCoolDownHtml);

	const interval = setInterval(function () {
		if (remindTime <= 0) {
			spell.isOnCooldown = false;
			setCssProperty(spell.spellCoolDownHtml.style, "display", "none");
			clearInterval(interval);
			return;
		}
		remindTime--;
		coolDownDisplay(remindTime, spell.spellCoolDownHtml);
	}, 1000)
}