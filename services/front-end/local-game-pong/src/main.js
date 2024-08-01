import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";
import loadSpell from "./controller/spell.js";
import {launchGame} from "./controller/game.js";
import {renderPageWithName} from "../../scripts/page.js";



//launchLocal();

/* launchLocal() {
	loadSpell();
	document.getElementById("buttonPlay").addEventListener("click", (event) => {
		document.getElementById("main").style.display = "block"
		launch();
		document.getElementById("menuStart").remove();
		launchGame();
	});
}*/

export default function launch() {
	loadSettings(document.getElementsByTagName("input"));
	renderPageWithName("pong-game.html");
	loadSpell();
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
	launchGame();
}