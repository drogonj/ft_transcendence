import DeleteAllBalls from "./spells/deleteAllBalls.js";

const spells = [];

export default function loadSpell() {
	spells.push(new DeleteAllBalls());
	//spells.set("default", new Spell());
}

export function Spell(cooldown = 30, spellName, icon, description) {
	this.cooldown = cooldown;
	this.spellName = spellName;
	this.description = description;
	this.icon = icon
}

Spell.prototype.executor = function () {
	console.log("hi1")
;}

export function getSpellWithName(spellName) {
	return spells.get(spellName);
}

export function getRandomSpells() {
	return [spells[0], spells[0]]
}