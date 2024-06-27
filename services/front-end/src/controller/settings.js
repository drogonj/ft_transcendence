
export const tickRate = 10;
export let moveSpeed;
export const moveStep = 10;
export let ballSpeed;
export let maxBallAngle;
export let maxTime;
export let maxBall;
export let respawnIfAllBallsGone;

export default function loadSettings(inputsHtml) {
	moveSpeed = inputsHtml[0].value - 10;
	ballSpeed = inputsHtml[1].value;
	maxBall = inputsHtml[2].value;
	maxBallAngle = inputsHtml[3].value * Math.PI / 180
	maxTime = inputsHtml[4].value;
	respawnIfAllBallsGone = inputsHtml[5].checked;
	//renderPageWithName("pong-game.html")
	//document.body.style.cursor = "none";
}