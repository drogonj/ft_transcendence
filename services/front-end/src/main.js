import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";


	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();

	document.addEventListener("click", function (evemt) {
		console.log(evemt.y, evemt.x)
	});
