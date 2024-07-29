import {
    addBallToMap,
} from "./map.js";

const balls = [];

export function createBall(socketValues) {
    new Ball(socketValues);
}

function Ball(socketValues) {
    this.ballId = socketValues["ballId"];
    this.ballHtml = document.createElement('div');
    this.ballHtml.classList.add("ball");
    this.ballActiveSpell = null;
    this.displayBall(socketValues["topPosition"], socketValues["leftPosition"]);
    addBallToMap(this.ballHtml);
    balls.push(this);
}

Ball.prototype.deleteBall = function () {
    balls.splice(balls.indexOf(this), 1);
    this.ballHtml.remove();
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

Ball.prototype.displayBall = function (topPosition, leftPosition) {
    this.ballHtml.style.top = topPosition;
	this.ballHtml.style.left = leftPosition;
}

function getBallWithId(ballId) {
    for (const ball of balls) {
        if (ball.ballId === ballId)
            return ball;
    }
}

export function moveBalls(socketValues) {
    socketValues["targetBalls"].forEach((ball) => {
        const targetBall = getBallWithId(ball["ballId"]);
        targetBall.displayBall(ball["topPosition"], ball["leftPosition"]);
    });
}