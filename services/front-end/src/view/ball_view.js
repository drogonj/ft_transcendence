export function moveBall(ball) {
	ball.ballHtml.style.top = (ball.ballHtml.offsetTop - ball.ballVy) + "px";
	ball.ballHtml.style.left = (ball.ballHtml.offsetLeft - ball.ballVx) + "px";
}

export function removeBall(ball) {
	ball.ballHtml.remove();
}
