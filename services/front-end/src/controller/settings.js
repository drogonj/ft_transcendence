export const tickRate = 10;
export let moveSpeed;
export const moveStep = 10;
export let ballSpeed;
export let maxBallAngle;
export let maxTime;
export let maxBall;
export let ai = false;

export default function loadSettings(inputsHtml) {
	moveSpeed = inputsHtml[0].value;
	ballSpeed = inputsHtml[1].value;
	maxBall = inputsHtml[2].value;
	maxBallAngle = inputsHtml[3].value * Math.PI / 180
	maxTime = inputsHtml[4].value;
	if (inputsHtml[5].checked)
		ai = true;
	document.getElementById("menuStart").remove();
}