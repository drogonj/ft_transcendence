import loadListeners from "./controller/listeners.js"
import loadPlayers from "./controller/player.js";
import loadBall from "./controller/ball.js";
import loadMap from "./controller/map.js";
import {loadHeader} from "./controller/header.js";
import loadSettings from "./controller/settings.js";

//Delete all the coming balls (don't give point)
//Slow all the comings balls for X seconds
//Increase the speed of the next hit ball
//The next hit ball will be clone. The cloned ball disappears when enemy hit him
//If the player is winning, remove 15% of the max game time, otherwise increase by 15%
//Steal 10% of the enemy points (minimum 1)
//Slow the enemy paddle by 50% for X seconds

launch();
document.addEventListener("click", (event) => {
	console.log(event.x, event.y)
})

export default function launch() {
	loadSettings(document.getElementsByTagName("input"))
	loadMap();
	loadListeners();
	loadPlayers();
	loadBall();
	loadHeader();
}