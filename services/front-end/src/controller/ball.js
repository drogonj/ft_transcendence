import {moveBall} from "../view/ball_view.js";
import {ballSpeed, maxBallAngle, tickRate} from "./settings.js";
import {getAllPaddles} from "./player.js";
import {getMapHeight, getMapLeft, getMapRight} from "./map.js";

const balls = [];

export default function loadBall() {
    balls.push(new Ball(document.getElementsByClassName("ball")[0]));
    tick();
}

function Ball(ballHtml) {
    this.ballHtml = ballHtml;
    this.ballVx = -(ballSpeed / 3);
    this.ballVy = 0;
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
    if (this.ballHtml.getBoundingClientRect().bottom >= getMapHeight() + document.getElementById("header").offsetHeight
        || this.ballHtml.getBoundingClientRect().top <= document.getElementById("header").offsetHeight)
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
    this.ballVy = -this.ballVy
}

function tick() {
    balls.forEach((ball) => {
        const targetPaddle = ball.isBallInsidePlayer()
        if (targetPaddle)
            ball.calculBallTraj(targetPaddle);
        else if (ball.isBallInsideBorder())
            ball.calculBallBorderTraj();
        else if (ball.isBallInGoal())
            return;
        moveBall(ball);
    });
	setTimeout(tick, tickRate);
}