export function moveBall(ball) {
	ball.ballTopPosition -= ball.ballVy;
	ball.ballLeftPosition -= ball.ballVx;
	displayBall(ball);
}

export function removeBall(ball) {
	ball.ballHtml.remove();
}

export function displayBall(ball) {
	ball.ballHtml.style.top = ball.ballTopPosition + "%";
	ball.ballHtml.style.left = ball.ballLeftPosition + "%";
}
