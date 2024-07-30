import {setCssProperty} from "./style_view.js";

export function createSpellDiv(spell) {
	const newDiv = document.createElement("div");
	const coolDownDiv = document.createElement("div");
	coolDownDiv.classList.add("spellCd");
	setCssProperty(coolDownDiv.style, "display", "none")
	newDiv.classList.add("spell")
	newDiv.appendChild(spell.icon);
	newDiv.appendChild(coolDownDiv);
	return newDiv;
}