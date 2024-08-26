export let moveSpeed;
export const moveStep = 10;
export let ballSpeed;
export let maxBallAngle;
export let maxTime;
export let maxBall;
export let respawnIfAllBallsGone;
export let ballSize;
export let paddleSize;
export let maxScore;
export let aiActive;
export let spellsActive;

export default function loadSettings(inputsHtml) {
	moveSpeed = inputsHtml[0].value - 10;
	paddleSize = inputsHtml[1].value;
	ballSpeed = inputsHtml[2].value;
	ballSize = inputsHtml[3].value;
	maxBall = inputsHtml[4].value;
	maxBallAngle = inputsHtml[5].value * Math.PI / 180
	maxTime = inputsHtml[6].value;
	maxScore = inputsHtml[7].value;
	spellsActive = inputsHtml[8].checked;
	aiActive = inputsHtml[9].checked;
	respawnIfAllBallsGone = inputsHtml[10].checked;
}