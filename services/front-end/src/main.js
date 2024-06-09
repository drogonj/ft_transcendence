import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";


	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();

	document.addEventListener("click", function (evemt) {
		console.log(evemt.y, evemt.x)
	});
