import {maxTime} from "./settings.js";
import {timerDisplay} from "../view/header_view.js";

let seconds = 0;
let minutes;
let timeHtml;

export function loadHeader() {
	minutes = maxTime;
	timeHtml = document.getElementById("headerTimer");
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
	timerDisplay(minutes, seconds, timeHtml);
	setTimeout(timerRun, 1000);
}