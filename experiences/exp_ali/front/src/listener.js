const tickRate = 10;
let keyDown = {}

document.addEventListener("keydown", function (e) {
    keyDown[e.key] = true;
});
document.addEventListener("keyup", function (e) {
    keyDown[e.key] = false;
});
const leftPlayerBar = document.getElementsByClassName("playerBar")[0]

function tick() {
    if (keyDown['ArrowUp']) {
        leftPlayerBar.style.top = (leftPlayerBar.offsetTop - 10) + "px";
    } else if (keyDown['ArrowDown']) {
      leftPlayerBar.style.top = (leftPlayerBar.offsetTop + 10) + "px";
    }
    setTimeout(tick, tickRate);
}

tick();