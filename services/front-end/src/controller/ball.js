import {moveBall} from "../view/ball_view.js";
import {ballSpeed, maxBallAngle, tickRate} from "./settings.js";
import {getAllPaddles} from "./player.js";
import {addBallToMap, getMapHeight, getMapLeft, getMapRight, isBottomPartOfMap, isTopPartOfMap} from "./map.js";

const balls = [];

export default function loadBall() {
    balls.push(new Ball());
    balls.push(new Ball(-1));
    balls.push(new Ball(-1, 8));
    tick();
}

function Ball(ballVx = 1, ballVy = 0) {
    this.ballHtml = document.createElement('div');
    this.ballHtml.classList.add("ball");
    this.ballVx = ballVx * (ballSpeed / 3);
    this.ballVy = ballVy;
    addBallToMap(this.ballHtml)
}

Ball.prototype.isBallInsidePlayer = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();

    for (const paddle of getAllPaddles()) {
        const paddleRect = paddle.paddleHtml.getBoundingClientRect();

        if (ballRect.right > paddleRect.left && ballRect.left < paddleRect.right
            && ballRect.top < paddleRect.bottom && ballRect.bottom > paddleRect.top)
                return paddle;
    }
}

Ball.prototype.isBallInsideBorder = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();

    if (ballRect.bottom >= getMapHeight() + document.getElementById("header").offsetHeight
        || ballRect.top <= document.getElementById("header").offsetHeight)
        return true;
}

Ball.prototype.isBallInGoal = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();
    if (ballRect.right >= getMapRight() || ballRect.left <= getMapLeft())
        return true;
}

Ball.prototype.calculBallTraj = function(paddle) {
    const paddleRec = paddle.paddleHtml.getBoundingClientRect();
    const intersectY = this.ballHtml.getBoundingClientRect().top + (this.ballHtml.getBoundingClientRect().height / 2);
    const paddleHeight = paddleRec.height;
    const relativeIntersectY = (intersectY - paddleRec.top) - (paddleHeight / 2);

    const normalizedRelativeIntersectionY = (relativeIntersectY / (paddleHeight / 2));
    const bounceAngle = normalizedRelativeIntersectionY * maxBallAngle;

    this.ballVx = ballSpeed * (paddle.paddleDirection * Math.cos(bounceAngle));
    this.ballVy = ballSpeed * -Math.sin(bounceAngle);
}

Ball.prototype.calculBallBorderTraj = function() {
    if (isBottomPartOfMap(this.ballHtml.getBoundingClientRect().y) && this.ballVy > 0)
        return;

    if (isTopPartOfMap(this.ballHtml.getBoundingClientRect().y) && this.ballVy < 0)
        return;

    this.ballVy = -this.ballVy
}

function tick() {
    balls.forEach((ball) => {
        const targetPaddle = ball.isBallInsidePlayer()
        if (targetPaddle)
            ball.calculBallTraj(targetPaddle);
        else if (ball.isBallInsideBorder()) {
            ball.calculBallBorderTraj();
        }
        else if (ball.isBallInGoal())
            return;
        moveBall(ball);
    });
	setTimeout(tick, tickRate);
}