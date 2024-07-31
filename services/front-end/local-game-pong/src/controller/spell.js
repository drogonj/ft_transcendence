import BallSlayer from "./spells/ball_slayer.js";
import BallFreeze from "./spells/ball_freeze.js";
import PaddleStun from "./spells/paddle_stun.js";
import BallPush from "./spells/ball_push.js";
import BallInvisible from "./spells/ball_invisible.js";
import BallClone from "./spells/ball_clone.js";
import PaddleSize from "./spells/paddle_size.js";
import {shuffle} from "./utils/utils.js";
import {createSpellDiv} from "../view/spell_view.js";
import {coolDownRun} from "./header.js";

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
	shuffle(spells);
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

Spell.prototype.executor = function(playerPaddle) {
	if (this.isOnCooldown)
		return false;
	coolDownRun(this);
	playerPaddle.statistics.increaseUsedSpells();
	this.performExecutor(playerPaddle)
}

export function getSpellWithName(spellName) {
	return spells.get(spellName);
}

export function getSpells(paddleDirection) {
	if (paddleDirection === -1)
		return spells.slice(0, 4);
	return spells.slice(4, spells.length);
}

export function setSpellDelay(delay) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("success")
		}, delay * 1000);
	})
}