import loadListeners from "./listeners.js"
import loadPlayers from "./player.js";
import loadBall from "./ball.js";
import loadMap from "./map.js";
import {loadHeader} from "./header.js";

export async function launch(inputsHtml) {
	loadMap();
	loadListeners();
	loadPlayers(inputsHtml);
	loadBall();
	loadHeader();
}