import BallSlayer from "./spells/ball_slayer.js";
import BallFreeze from "./spells/ball_freeze.js";

const spells = [];

export default function loadSpell() {
	spells.push(new BallSlayer());
	spells.push(new BallFreeze());
}

export function Spell(cooldown = 30, spellName, icon, description) {
	this.cooldown = cooldown;
	this.spellName = spellName;
	this.description = description;
	this.icon = icon
	this.isOnCooldown = false;
}

export function getSpellWithName(spellName) {
	return spells.get(spellName);
}

export function getRandomSpells() {
	return [spells[0], spells[1]]
}

export function setCooldown(spell) {
	spell.isOnCooldown = true;
	setTimeout(() => {
		spell.isOnCooldown = false;
	}, spell.cooldown * 1000);
}

export function spellLaunchController(spell) {
	if (spell.isOnCooldown)
		return false;
	setCooldown(spell);
	return true;
}