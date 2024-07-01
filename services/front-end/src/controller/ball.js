import {displayBall, moveBall, removeBall} from "../view/ball_view.js";
import {ballSpeed, maxBall, maxBallAngle, respawnIfAllBallsGone, tickRate} from "./settings.js";
import {getAllPaddles, getLeftPaddle, getLeftPlayerHeader, getRightPaddle, getRightPlayerHeader} from "./player.js";
import {
    addBallToMap,
    getMapHeight,
    getMapLeft,
    getMapRight, getMapTop,
    isBottomPartOfMap, isMapContainMaxBall, isMapContainNoBall,
    isTopPartOfMap,
    markPoint
} from "./map.js";
import {getRandomNumberBetweenOne, getRandomNumberWithDecimal} from "./math_utils.js";

const balls = [];

export default function loadBall() {
    while(!isMapContainMaxBall())
        createNewBall();
    tick();
}

function createNewBall() {
    balls.push(new Ball());
}

Ball.prototype.deleteBall = function () {
    balls.splice(balls.indexOf(this), 1);
    removeBall(this)
}

function Ball() {
    this.ballHtml = document.createElement('div');
    this.ballHtml.classList.add("ball");
    this.ballVx = 0.4 * getRandomNumberBetweenOne();
    this.ballVy = getRandomNumberWithDecimal(0.1, 0.7);
    this.ballTopPosition = 50;
    this.ballLeftPosition = 50;
    displayBall(this);
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

    if (ballRect.bottom >= getMapHeight() || ballRect.top <= getMapTop())
        this.calculBallBorderTraj()
}

Ball.prototype.triggerBallInGoal = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();
    if (ballRect.right >= getMapRight())
        markPoint(this, getLeftPlayerHeader());
    else if (ballRect.left <= getMapLeft())
        markPoint(this, getRightPlayerHeader());
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
    console.log(this.ballVx, this.ballVy)
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
    ballsSpawnTrigger();
	setTimeout(tick, tickRate);
}

export function getBallNumber() {
    return balls.length;
}

function ballsSpawnTrigger() {
    if (isMapContainMaxBall())
        return;

    if (!respawnIfAllBallsGone)
        createNewBall();

    if (isMapContainNoBall())
        while(!isMapContainMaxBall())
            createNewBall();
}