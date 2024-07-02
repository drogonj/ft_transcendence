import BallSlayer from "./spells/ball_slayer.js";
import BallFreeze from "./spells/ball_freeze.js";
import PaddleStun from "./spells/paddle_stun.js";
import BallPush from "./spells/ball_push.js";

const spells = [];

export default function loadSpell() {
	spells.push(new BallSlayer());
	spells.push(new BallFreeze());
	spells.push(new BallPush());
	spells.push(new PaddleStun());
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
	return spells
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

export function setSpellDelay(delay) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, delay * 1000);
	})
}