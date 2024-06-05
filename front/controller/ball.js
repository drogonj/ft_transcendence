import {moveBall} from "../view/ball_view.js";
import {ballSpeed} from "./settings.js";

const balls = [];
const leftPlayerBar = document.getElementsByClassName("playerBar")[0];

export default function loadBall() {
    balls.push(document.getElementsByClassName("ball")[0]);
    tick();
}

function tick() {
    if (!isBallInsidePlayer())
        moveBall(balls[0]);
	setTimeout(tick, ballSpeed);
}

function isBallInsidePlayer() {
    console.log("bt: ", balls[0].getBoundingClientRect().top, balls[0].getBoundingClientRect().bottom)
    console.log("bar: ", leftPlayerBar.getBoundingClientRect().top, leftPlayerBar.getBoundingClientRect().bottom)

    if (balls[0].getBoundingClientRect().top < leftPlayerBar.getBoundingClientRect().top
        && balls[0].getBoundingClientRect().bottom > leftPlayerBar.getBoundingClientRect().bottom)
        return true;
}