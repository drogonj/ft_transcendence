import {Spell} from "../spell.js";

export default function DeleteAllBalls() {
	Spell.call(this, 8, "deleteAllBalls", "none");
}