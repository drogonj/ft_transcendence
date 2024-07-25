import BallSlayer from "./spells/ball_slayer.js";
import BallFreeze from "./spells/ball_freeze.js";
import PaddleStun from "./spells/paddle_stun.js";
import BallPush from "./spells/ball_push.js";
import BallInvisible from "./spells/ball_invisible.js";
import BallClone from "./spells/ball_clone.js";
import PaddleSize from "./spells/paddle_size.js";
import {coolDownRun} from "./header.js";
import {setCssProperty} from "./game.js";

const spells = [];

export default function loadSpell() {
	spells.push(new BallSlayer());
	spells.push(new BallFreeze());
	spells.push(new BallPush());
	spells.push(new BallClone());
	spells.push(new PaddleSize());
	spells.push(new BallInvisible());
	spells.push(new PaddleStun());
	spells.push(new PaddleStun());
}

export function Spell(cooldown, spellName, description, icon) {
	this.cooldown = cooldown;
	this.spellName = spellName;
	this.description = description;
	this.icon = icon;
	this.isOnCooldown = false;
	this.spellHtml = createSpellDiv(this);
	this.spellCoolDownHtml = this.spellHtml.getElementsByClassName("spellCd")[0];
}

export function getSpellWithName(spellName) {
	return spells.get(spellName);
}

export function spellLaunchController(spell) {
	if (spell.isOnCooldown)
		return false;
	coolDownRun(spell);
	return true;
}

export function setSpellDelay(delay) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, delay * 1000);
	})
}

function createSpellDiv(spell) {
	const newDiv = document.createElement("div");
	const coolDownDiv = document.createElement("div");
	coolDownDiv.classList.add("spellCd");
	setCssProperty(coolDownDiv.style, "display", "none")
	newDiv.classList.add("spell")
	newDiv.appendChild(spell.icon);
	newDiv.appendChild(coolDownDiv);
	return newDiv;
}