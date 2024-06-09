import {maxTime} from "./settings.js";
import {timerDisplay} from "../view/header_view.js";

let seconds = 0;
let minutes;

export function loadHeader() {
	minutes = maxTime;
	timerRun();
}

function timerRun() {
	if (seconds <= 0) {
		minutes--;
		seconds = 59;
	} else
		seconds--;
	if (minutes <= 0 && seconds <= 0)
		return;
	timerDisplay(minutes, seconds)
	setTimeout(timerRun, 1000);
}