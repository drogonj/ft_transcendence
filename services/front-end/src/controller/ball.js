import {moveBall, removeBall} from "../view/ball_view.js";
import {ballSpeed, maxBall, maxBallAngle, tickRate} from "./settings.js";
import {getAllPaddles, getLeftPlayerHeader, getRightPlayerHeader} from "./player.js";
import {
    addBallToMap,
    getMapHeight,
    getMapLeft,
    getMapRight,
    isBottomPartOfMap, isMapContainMaxBall,
    isTopPartOfMap,
    markPoint
} from "./map.js";
import {getRandomNumberBetweenOne, getRandomNumberWithDecimal} from "./math_utils.js";

const balls = [];

export default function loadBall() {
    for (let i = 0; i < maxBall; i++) {
        createNewBall();
    }
    tick();
}

function createNewBall() {
    balls.push(new Ball(getRandomNumberBetweenOne(), getRandomNumberWithDecimal(-8, 8)));
}

Ball.prototype.deleteBall = function () {
    balls.splice(balls.indexOf(this), 1);
    removeBall(this)
}

function Ball(ballVx = 1, ballVy = 0) {
    this.ballHtml = document.createElement('div');
    this.ballHtml.classList.add("ball");
    this.ballVx = ballVx * (ballSpeed / 3);
    this.ballVy = ballVy;
    addBallToMap(this.ballHtml)
}

Ball.prototype.triggerBallInsidePlayer = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();

    for (const paddle of getAllPaddles()) {
        const paddleRect = paddle.paddleHtml.getBoundingClientRect();

        if (ballRect.right > paddleRect.left && ballRect.left < paddleRect.right
            && ballRect.top < paddleRect.bottom && ballRect.bottom > paddleRect.top)
                this.calculBallTraj(paddle);
    }
}

Ball.prototype.triggerBallInsideBorder = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();

    if (ballRect.bottom >= getMapHeight() + document.getElementById("header").offsetHeight
        || ballRect.top <= document.getElementById("header").offsetHeight)
        this.calculBallBorderTraj()
}

Ball.prototype.triggerBallInGoal = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();
    if (ballRect.right >= getMapRight())
        markPoint(this, getRightPlayerHeader());
    else if (ballRect.left <= getMapLeft())
        markPoint(this, getLeftPlayerHeader());
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
        //todo dont do all trigger
        ball.triggerBallInsidePlayer();
        ball.triggerBallInsideBorder();
        ball.triggerBallInGoal()
        moveBall(ball);
    });
    if (!isMapContainMaxBall())
        createNewBall();
	setTimeout(tick, tickRate);
}

export function getBallNumber() {
    return balls.length;
}