import {moveBall} from "../view/ball_view.js";
import {ballSpeed} from "./settings.js";

const balls = [];
const leftPlayerBar = document.getElementsByClassName("playerBar")[0];

export default function loadBall() {
    balls.push(document.getElementsByClassName("ball")[0]);
    tick();
    document.addEventListener("click", e => {
        console.log(e.x)
    });
}

function tick() {
    if (!isBallInsidePlayer())
        moveBall(balls[0]);
	setTimeout(tick, ballSpeed);
}

function isBallInsidePlayer() {
    if (balls[0].getBoundingClientRect().left < 0)
        return true;

    if (balls[0].getBoundingClientRect().left > leftPlayerBar.getBoundingClientRect().right)
        return false;

    if (balls[0].getBoundingClientRect().top < leftPlayerBar.getBoundingClientRect().bottom &&
        balls[0].getBoundingClientRect().bottom > leftPlayerBar.getBoundingClientRect().top)
        return true;
}