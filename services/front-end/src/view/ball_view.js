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

export function setBallSize(ball, ballSize) {
	ball.ballHtml.style.height = ballSize * 2 + "%";
	ball.ballHtml.style.width = ballSize + "%";
}

export function setBallColor(ball, color) {
	ball.ballHtml.style.backgroundColor = color;
}

export function setBallAnimation(ball, animation) {
	ball.ballHtml.style.animation = animation;
}

export function removeBallProperty(ball, property) {
	ball.ballHtml.style.removeProperty(property);
}

export function setBallStyleProperty(ball, property, value) {
	ball.ballHtml.style.setProperty(property, value);
}