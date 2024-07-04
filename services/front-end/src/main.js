import loadListeners, {keyDown} from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";
import loadSpell from "./controller/spell.js";
import {launchGame} from "./controller/game.js";

//Delete all the coming balls (don't give point) **
//Slow all the comings balls for X seconds **
//Increase the speed of the next hit ball **
//The next hit ball will be clone. **
//ball invisible **
//ball revers point
//Slow the enwemy paddle by 50% for X seconds
//Enemy paddle cant move for X seconds **

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