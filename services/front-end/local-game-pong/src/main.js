import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";
import loadSpell from "./controller/spell.js";
import {launchGame, startGame} from "./controller/game.js";
import {navigateTo} from "../../scripts/contentLoader.js";
import {getCsrfToken, csrfToken} from "../../scripts/auth.js";

export default function setupLocalGame() {
	loadSettings(document.getElementsByTagName("input"));
	navigateTo("/game-local", true);
	loadSpell();
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
	launchGame();
	setIngame();
}

export function startlocalGame() {
	startGame();
}

async function setIngame() {
	await getCsrfToken();
	const response = await fetch('/api/user/statement/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken
		},
		body: JSON.stringify({
			"state": "local_game_started",
		})
	});
}

export async function unsetIngame(event) {
	await getCsrfToken();
	const response = await fetch('/api/user/statement/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken
		},
		body: JSON.stringify({
			"state": "local_game_ended",
		})
	});
}
