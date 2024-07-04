export function timerDisplay(minutes, seconds, timeHtml) {
	if (seconds <= 9)
		seconds = "0" + seconds
	if (minutes <= 9)
		minutes = "0" + minutes
	timeHtml.textContent = minutes + ":" + seconds
}

export function addSpellsToHeader(playerHeader, spells) {
	const div = document.createElement("div");
	div.classList.add("spell")

	spells.forEach((spell) => {
		const newDiv = div.cloneNode(true);
		newDiv.appendChild(spell.icon);
		playerHeader.getElementsByClassName("spellContainer")[0].appendChild(newDiv);
	});
}