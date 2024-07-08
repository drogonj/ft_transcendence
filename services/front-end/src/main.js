import loadListeners, {keyDown} from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";
import loadSpell from "./controller/spell.js";
import {launchGame} from "./controller/game.js";

//End score
//Number of touched ball
//Number of used spell
//Time without taking any goals
//Number of goals in a row.


launchLocal();

/*document.addEventListener("keydown", function (e) {
	const s = getSpellWithName("test").executor();
});*/

function launchLocal() {
	loadSpell();
	document.getElementById("buttonPlay").addEventListener("click", (event) => {
		document.getElementById("main").style.display = "block"
		launch();
		document.getElementById("menuStart").remove();
		launchGame();
	});
}

export default function launch() {
	loadSettings(document.getElementsByTagName("input"))
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
}