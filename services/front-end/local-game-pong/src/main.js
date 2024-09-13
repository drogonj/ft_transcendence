import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";
import loadSpell from "./controller/spell.js";
import {launchGame} from "./controller/game.js";
import {navigateTo} from "../../scripts/contentLoader.js";
import {friendSocket} from "../../scripts/friends.js";

export default function launchLocalGame() {
	loadSettings(document.getElementsByTagName("input"));
	navigateTo("/game-local", true);
	loadSpell();
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
	launchGame();
	const message = {
		"in-game": true,
	}
	friendSocket.send(JSON.stringify(message));
}
