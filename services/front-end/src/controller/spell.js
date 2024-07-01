import DeleteAllBalls from "./spells/deleteAllBalls.js";

const spells = new Map();

export default function loadSpell() {
	spells.set("test", new DeleteAllBalls());
}

export function Spell(cooldown = 30, spellName, description) {
	this.cooldown = cooldown;
	this.spellName = spellName;
	this.description = description;
}

Spell.prototype.executor = function () {
	console.log("hi")
;}

export function getSpellWithName(spellName) {
	return spells.get(spellName);
}