const tickRate = 10;
let keyDown = {}
const mapHeigth = document.getElementById("map").offsetHeight;
const playerHeight =document.getElementsByClassName("playerBar")[0].offsetHeight;

document.addEventListener("keydown", function (e) {
    keyDown[e.key] = true;
});
document.addEventListener("keyup", function (e) {
    keyDown[e.key] = false;
});
const leftPlayerBar = document.getElementsByClassName("playerBar")[0]

function tick() {
    if (keyDown['ArrowUp']) {
        if (leftPlayerBar.offsetTop - 10 >= 0)
            leftPlayerBar.style.top = (leftPlayerBar.offsetTop - 10) + "px";
    } else if (keyDown['ArrowDown']) {
        if ((leftPlayerBar.offsetTop + playerHeight) + 10 <= mapHeigth)
            leftPlayerBar.style.top = (leftPlayerBar.offsetTop + 10) + "px";
    }
    setTimeout(tick, tickRate);
}

tick();