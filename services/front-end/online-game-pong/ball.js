import {
    addBallToMap,
} from "./map.js";

const balls = [];

export function createBall(socketData) {
    new Ball(socketData);
}

function Ball(socketValues) {
    this.ballId = balls.length;
    this.ballHtml = document.createElement('div');
    this.ballHtml.classList.add("ball");
    this.ballActiveSpell = null;
    this.displayBall("50%", "50%");
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