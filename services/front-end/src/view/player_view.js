export function movePlayerPaddleUp(playerPaddle) {
	playerPaddle.playerTopPosition--;
	displayPlayerPaddle(playerPaddle)
}

export function movePlayerPaddleDown(playerPaddle) {
	playerPaddle.playerTopPosition++;
	displayPlayerPaddle(playerPaddle)
}

export function displayPlayerPoint(scoreHtml, text) {
	scoreHtml.textContent = text;
}

export function displayPlayerPaddle(playerPaddle) {
	playerPaddle.paddleHtml.style.top = playerPaddle.playerTopPosition + "%";
}