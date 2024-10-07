import {loadHeader, timerDecrease} from "./header.js";
import {loadListeners, removeListeners} from "./listeners.js";
import loadMap from "./map.js";
import {clearBalls, createBall, getBallWithId} from "./ball.js";
import {createPlayers, getPlayerWithSide, stopPlayerLoop} from "./player.js";
import {closeWebSocket} from "./websocket.js";
import {navigateTo} from "../scripts/contentLoader.js";
import {displayStatistics} from "./statistics.js";
import {joinTournament} from "../scripts/tournament.js";

let globalGameLoop;

export function launchGame(socketValues) {
	createPlayers(socketValues);
	loadListeners();
	loadMap();
	loadHeader();
	createBall(socketValues);
	displayWarmupMenu();
	startGlobalGameLoop();
}

function startGlobalGameLoop() {
	if (document.getElementById('announcement')) {
		const actualTime = parseInt(document.getElementById("timeBeforeStart").textContent);
		document.getElementById("timeBeforeStart").textContent = (actualTime-1).toString();
		if (actualTime <= 0) {
			document.getElementById("announcement").remove();
			timerDecrease();
		}
	} else
		timerDecrease();
	globalGameLoop = setTimeout(startGlobalGameLoop, 1000);
}

export function removeCssProperty(cssStyle, property) {
	cssStyle.removeProperty(property);
}

export function setCssProperty(cssStyle, property, value) {
	cssStyle.setProperty(property, value);
}

export function newImage(imagePath, id, className) {
	const img = new Image();

	img.onerror = function() {
		throw new Error(`Failed to load image ` + imagePath);
	};

	img.src = imagePath;
	img.setAttribute('id', id);
	img.setAttribute('draggable', "false");
	if (className)
		img.classList.add(className);
	return img;
}

export function markPoint(socketValues) {
	const ball = getBallWithId(socketValues["ballId"]);
	const targetPlayer = getPlayerWithSide(socketValues["targetPlayer"]);
	ball.deleteBall();
	targetPlayer.increaseScore();
	targetPlayer.displayPoint()
}

export function clearGame() {
	clearBalls();
	stopPlayerLoop();
	removeListeners();
	clearTimeout(globalGameLoop);
}

export function endGame(socketValues) {
	clearGame();
	closeWebSocket();
	if (socketValues["tournamentId"]) {
		joinTournament(socketValues["tournamentId"]);
		return;
	}

	navigateTo("/game-end", true);
	displayStatistics(socketValues);
}

function displayWarmupMenu() {
	buildWarmupSide(document.getElementById("infoLeft"), getPlayerWithSide('Left'));
	buildWarmupSide(document.getElementById("infoRight"), getPlayerWithSide('Right'));
}

function buildWarmupSide(warmupHtml, playerTarget) {
	warmupHtml.getElementsByClassName("warmupImage")[0].src = playerTarget.getPlayerAvatarFromHeader();
	warmupHtml.getElementsByClassName("infoUserName")[0].textContent = playerTarget.getPlayerUserNameFromHeader();

	const spellsContainer = warmupHtml.getElementsByClassName("spells")[0];
	playerTarget.playerSpells.forEach((spell) => {
		const mainSpellInfo = document.createElement('div');
		mainSpellInfo.classList.add("spellInfo");

		const imageAndName = document.createElement('div');
		imageAndName.classList.add('imageAndName');

		const spellImage = document.createElement('img');
		const spellName = document.createElement('div');
		spellImage.classList.add('warmupSpellImage');
		spellImage.src = spell.icon.src;
		spellName.classList.add('warmupSpellName');
		spellName.textContent = spell.spellName;

		const description = document.createElement('div');
		description.classList.add('description');
		description.textContent = spell.description;

		imageAndName.appendChild(spellImage);
		imageAndName.appendChild(spellName);

		mainSpellInfo.appendChild(imageAndName);
		mainSpellInfo.appendChild(description);

		spellsContainer.appendChild(mainSpellInfo);
	})
}