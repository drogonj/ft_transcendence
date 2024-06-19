import loadListeners from "../controller/listeners.js"
import loadPlayers from "../controller/player.js";
import loadBall from "../controller/ball.js";
import loadMap from "../controller/map.js";
import {loadHeader} from "../controller/header.js";

export async function launch() {
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
}