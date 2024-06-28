const timeHtml = document.getElementById("headerTimer")

function formatTimeUnit(unit) {
	return unit < 10 ? '0' + unit : unit;
}
export function timerDisplay(minutes, seconds) {
	if (seconds <= 9)
		seconds = "0" + seconds
	if (minutes <= 9)
		minutes = "0" + minutes
	timeHtml.textContent = minutes + ":" + formatTimeUnit(seconds)
}