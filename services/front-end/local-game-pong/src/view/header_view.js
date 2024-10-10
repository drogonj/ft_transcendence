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

export function buildWarmupLocal(warmupHtml, playerTarget) {
		const spellsContainer = warmupHtml.getElementsByClassName("spells")[0];

		playerTarget.playerSpells.forEach((spell) => {
		const mainSpellInfo = document.createElement('div');
		mainSpellInfo.classList.add("spellInfo");

		const imageAndName = document.createElement('div');
		imageAndName.classList.add('imageAndName');

		const spellImage = document.createElement('img');
		const spellName = document.createElement('div');
		spellImage.classList.add('warmupSpellImage');
		spellImage.src = spell.icon.src;
		spellName.classList.add('warmupSpellName');
		spellName.textContent = spell.spellName;

		const description = document.createElement('div');
		description.classList.add('description');
		description.textContent = spell.description;

		imageAndName.appendChild(spellImage);
		imageAndName.appendChild(spellName);

		mainSpellInfo.appendChild(imageAndName);
		mainSpellInfo.appendChild(description);

		spellsContainer.appendChild(mainSpellInfo);
	})
}