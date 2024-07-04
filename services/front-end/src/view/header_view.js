export function timerDisplay(minutes, seconds, timeHtml) {
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