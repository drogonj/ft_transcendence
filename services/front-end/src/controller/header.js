import {moveBall} from "../view/ball_view.js";
import {tickRate} from "./settings.js";
import {timerDisplay} from "../view/header_view.js";

let seconds = 0;
let minutes;

const timeHtml = document.getElementById("headerTimer")

export function loadHeader() {
	minutes = 10;
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