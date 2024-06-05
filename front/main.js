import loadListeners from "./controller/listeners.js"
import loadPlayer from "./controller/player.js";
import loadBall from "./controller/ball.js";

//create initGame function
loadListeners();
loadBall();
loadPlayer();