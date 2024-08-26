import {setTopPositionToPlayer} from "./player.js";
import {createBall, moveBalls} from "./ball.js";
import {clearGame, endGame, launchGame, markPoint} from "./game.js";
import {currentUser} from "../scripts/auth.js";
import {getHostNameFromURL, navigateTo} from "../scripts/contentLoader.js";
import {launchSpell} from "./spell.js";

let ws;

export default function launchClientGame(userId, username) {
    ws = new WebSocket(`wss://${getHostNameFromURL()}/ws/back`);
    ws.onopen = function () {
        console.log("WebSocket with Game server is open now.");
        sendMessageToServer("bindSocket", {"userId": userId, "username": username})
    };
    ws.onmessage = onReceive;
    ws.onerror = onError;
    ws.onclose = function () {
        clearGame();
    }
}

export function launchFriendGame(data) {
	ws.onopen = async function() {
		if (currentUser.user_id === data.receiver_id) {
			sendMessageToServer("createGame", {"userId1": data.receiver_id, "userId2": data.user_id})
			sendMessageToServer("createPlayer", {"userId": data.user_id, "side": "Left"})
			sendMessageToServer("createPlayer", {"userId": data.receiver_id, "side": "Right"})
			sendMessageToServer("bindSocket", {"userId": currentUser.user_id, "username": currentUser.username})
		} else {
			await new Promise(r => setTimeout(r, 50));
			sendMessageToServer("bindSocket", {"userId": currentUser.user_id, "username": currentUser.username})
		}
	};
	ws.onmessage = onReceive;
    ws.onerror = onError;
    ws.onclose = function () {
        clearGame();
    }
}

export function launchClientMatchMaking() {
    ws = new WebSocket(`wss://${getHostNameFromURL()}/ws/matchmaking`);
    ws.onopen = function () {
        console.log("WebSocket MatchMaking server is open now.");
        sendMessageToServer("createUser", {"userId": currentUser.user_id})
        navigateTo('/waiting-screen', true);
    };
    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.type === "connectTo") {
            document.getElementById("matchMakingCancel").disabled = "disabled"
            document.getElementById("mainTitle").textContent = "Player found ! Setting up the game.."
            ws.close();
            launchClientGame(currentUser.user_id, currentUser.username);
        }
    }
    ws.onerror = onError;
}

export function closeWebSocket() {
    ws.close();
}

export function sendMessageToServer(type, values) {
    const message = {
        "type": type,
        "values": values
    }
    ws.send(JSON.stringify(message));
}

function onError(event) {
    console.error("WebSocket error observed:", event);
}

function onReceive(event) {
    const data = JSON.parse(event.data);

    if (data.type === "moveBall")
        moveBalls(data.values);
    else if (data.type === "movePlayer")
        setTopPositionToPlayer(data.values);
    else if (data.type === "launchSpell")
        launchSpell(data.values);
    else if (data.type === "createBall")
        createBall(data.values);
    else if (data.type === "displayScore")
        markPoint(data.values)
    else if (data.type === "renderPage")
        navigateTo(data.values["url"], true);
    else if (data.type === "launchGame")
        launchGame(data.values);
    else if (data.type === "endGame")
        endGame(data.values);
    else if (data.type === "launchClientGame")
        launchClientGame(data.values)
    else
        console.log("Error: Server send a unknown type of data");
}

export function isWebSocketBind() {
    return ws && ws.readyState === WebSocket.OPEN;
}

export function bindGameSocket(socket) {
	ws = socket;
}