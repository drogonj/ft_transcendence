import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";

export default function initGame() {
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
}