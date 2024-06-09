import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";


document.getElementById("buttonPlay").addEventListener("click", function (evemt) {
	launch()
});
function launch() {
	loadSettings(document.getElementsByTagName("input"))
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
}