let seconds = 0;
let minutes = 5;
let timeHtml;

export function setTextContentToHtmlElement(htmlElement, textContent) {
	document.getElementById("htmlElement").textContent = textContent
}

export function loadHeader() {
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

function timerDisplay(minutes, seconds, timeHtml) {
	if (seconds <= 9)
		seconds = "0" + seconds
	if (minutes <= 9)
		minutes = "0" + minutes
	timeHtml.textContent = minutes + ":" + seconds
}

export function coolDownDisplay(seconds, spellHtml) {
	spellHtml.textContent = seconds;
}

export function addSpellsToHeader(playerHeader, spells) {
	spells.forEach((spell) => {
		playerHeader.getElementsByClassName("spellContainer")[0].appendChild(spell.spellHtml);
	});
}