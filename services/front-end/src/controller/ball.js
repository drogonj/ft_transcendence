import {displayBall, moveBall, removeBall, setBallSize} from "../view/ball_view.js";
import {ballSize, ballSpeed, maxBall, maxBallAngle, respawnIfAllBallsGone} from "./settings.js";
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

export function createNewBall() {
    const newBall = new Ball();
    balls.push(newBall);
    return newBall;
}

export function copyBall(ball) {
    const newBall = createNewBall();
    newBall.ballVx = ball.ballVx;
    newBall.ballVy = ball.ballVy;
    newBall.ballTopPosition = ball.ballTopPosition;
    newBall.ballLeftPosition = ball.ballLeftPosition;
    newBall.ballActiveSpell = ball.ballActiveSpell;
    return newBall;
}

Ball.prototype.deleteBall = function () {
    balls.splice(balls.indexOf(this), 1);
    removeBall(this);
}

function Ball() {
    this.ballHtml = document.createElement('div');
    this.ballHtml.classList.add("ball");
    this.ballVx = 0.4 * getRandomNumberBetweenOne();
    this.ballVy = getRandomNumberWithDecimal(0.1, 0.7);
    this.ballTopPosition = 50;
    this.ballLeftPosition = 50;
    this.ballActiveSpell = null;
    setBallSize(this, ballSize);
    displayBall(this);
    addBallToMap(this.ballHtml)
}

Ball.prototype.triggerBallInsidePlayer = function () {
    const ballRect = this.ballHtml.getBoundingClientRect();

    for (const paddle of getAllPaddles()) {
        const paddleRect = paddle.paddleHtml.getBoundingClientRect();

        if (ballRect.right > paddleRect.left && ballRect.left < paddleRect.right
            && ballRect.top < paddleRect.bottom && ballRect.bottom > paddleRect.top) {
            this.calculBallTraj(paddle);
            if (this.ballActiveSpell)
                this.ballActiveSpell.onHit(this);
        }
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

    this.ballVx = paddle.paddleDirection * Math.cos(bounceAngle);
    this.ballVy = -Math.sin(bounceAngle);
}

Ball.prototype.calculBallBorderTraj = function() {
    if (isBottomPartOfMap(this.ballHtml.getBoundingClientRect().y) && this.ballVy > 0)
        return;

    if (isTopPartOfMap(this.ballHtml.getBoundingClientRect().y) && this.ballVy < 0)
        return;

    this.ballVy = -this.ballVy;
}

Ball.prototype.getBallDirection = function () {
    return this.ballVx;
}

Ball.prototype.getBallStyle = function () {
    return this.ballHtml.style;
}

Ball.prototype.setActiveSpell = function (spell) {
    if (this.ballActiveSpell)
        this.ballActiveSpell.destructor(this);
    this.ballActiveSpell = spell;
}

Ball.prototype.removeActiveSpell = function() {
    this.ballActiveSpell = null;
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
	setTimeout(tick, ballSpeed);
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

export function getAllBallInSide(side) {
    return balls.filter((ball) => {
        if (side === 0)
            return ball.getBallDirection() > 0;
        else
            return ball.getBallDirection() <= 0;
    })
}