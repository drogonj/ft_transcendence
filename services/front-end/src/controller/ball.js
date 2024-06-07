import {moveBall} from "../view/ball_view.js";
import {ballSpeed, ballStep, maxBallAngle} from "./settings.js";
import {getLeftPlayer} from "./player.js";
import {getMapHeight} from "./map.js";

const balls = [];

export default function loadBall() {
    balls.push(new Ball(document.getElementsByClassName("ball")[0]));

    tick();
}

function Ball(ballHtml) {
    this.ballHtml = ballHtml;
    this.ballVx = 3;
}

Ball.prototype.isBallInsidePlayer = function () {
    let leftPlayerPaddle = getLeftPlayer();

    if (this.ballHtml.getBoundingClientRect().left > leftPlayerPaddle.paddleHtml.getBoundingClientRect().right)
        return false;

    if (this.ballHtml.getBoundingClientRect().top < leftPlayerPaddle.paddleHtml.getBoundingClientRect().bottom &&
        this.ballHtml.getBoundingClientRect().bottom > leftPlayerPaddle.paddleHtml.getBoundingClientRect().top)
        return true;
}

Ball.prototype.isBallInsideBorder = function () {
    const mapHeight = getMapHeight()

    if (this.ballHtml.getBoundingClientRect().bottom >= mapHeight * 90 / 100)
        return true;
}

Ball.prototype.calculBallTraj = function(paddle) {
    const paddleRec = paddle.paddleHtml.getBoundingClientRect();
    const intersectY = this.ballHtml.getBoundingClientRect().top + (this.ballHtml.getBoundingClientRect().height / 2);
    const paddleHeight = paddleRec.height;
    const relativeIntersectY = (intersectY - paddleRec.top) - (paddleHeight / 2);

    const normalizedRelativeIntersectionY = (relativeIntersectY / (paddleHeight / 2));
    const bounceAngle = normalizedRelativeIntersectionY * maxBallAngle;
    this.ballVx = ballSpeed * -Math.cos(bounceAngle);

    this.ballVy = ballSpeed * -Math.sin(bounceAngle);
    console.log(this.ballVx, this.ballVy)
}

Ball.prototype.calculBallBorderTraj = function(paddle) {
    const paddleRec = paddle.paddleHtml.getBoundingClientRect();
    const intersectY = this.ballHtml.getBoundingClientRect().top + (this.ballHtml.getBoundingClientRect().height / 2);
    const paddleHeight = paddleRec.height;
    const relativeIntersectY = (intersectY - paddleRec.top) - (paddleHeight / 2);

    const normalizedRelativeIntersectionY = (relativeIntersectY / (paddleHeight / 2));
    const bounceAngle = normalizedRelativeIntersectionY * maxBallAngle;
    this.ballVx = ballSpeed * -Math.cos(bounceAngle);

    this.ballVy = ballSpeed * -Math.sin(bounceAngle);
    console.log(this.ballVx, this.ballVy)
}

function tick() {
    balls.forEach((ball) => {
        if (ball.isBallInsidePlayer())
            ball.calculBallTraj(getLeftPlayer());
        else if (ball.isBallInsideBorder()) {
            console.log("ALERT")
            ball.calculBallBorderTraj(getLeftPlayer());
        }
        moveBall(ball);
    });
	setTimeout(tick, ballSpeed);
}