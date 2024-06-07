import {moveBall} from "../view/ball_view.js";
import {ballSpeed} from "./settings.js";
import {getLeftPlayer} from "./player.js";

const balls = [];

function Ball() {
    this.msg = "slt";

    this.greet = function() {
        console.log(`sa ${this.msg}`)
    }
}

Ball.prototype.greet = function () {
    console.log(`sa ${this.msg}`)
}

export default function loadBall() {
    const ba = new Ball();
    ba.greet();
    balls.push(document.getElementsByClassName("ball")[0]);

    tick();
}

function tick() {
    if (!isBallInsidePlayer())
        moveBall(balls[0]);
	setTimeout(tick, ballSpeed);
}

function isBallInsidePlayer() {
    if (balls[0].getBoundingClientRect().left < 0)
        return true;

    let leftPlayerBar = getLeftPlayer();

    if (balls[0].getBoundingClientRect().left > leftPlayerBar.getBoundingClientRect().right)
        return false;

    if (balls[0].getBoundingClientRect().top < leftPlayerBar.getBoundingClientRect().bottom &&
        balls[0].getBoundingClientRect().bottom > leftPlayerBar.getBoundingClientRect().top)
        return true;
}