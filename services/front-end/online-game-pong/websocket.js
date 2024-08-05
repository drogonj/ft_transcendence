import {renderPageWithName} from "../scripts/page.js";
import {setTopPositionToPlayer} from "./player.js";
import {createBall, moveBalls} from "./ball.js";
import {launchGame, markPoint} from "./game.js";
import {currentUser} from "../scripts/auth.js";

let ws;

export default function launchClientGame(socketValues) {
    ws = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/back`);
    ws.onopen = function () {
        console.log("WebSocket NatchMaking is open now.");
        sendMessageToServer("bindSocket", {"username": currentUser.username})
    };
    ws.onmessage = onReceive;
    ws.onerror = onError;
}

export function launchClientMatchMaking() {
    ws = new WebSocket(`wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws/matchmaking`);
    ws.onopen = function () {
        console.log("WebSocket MatchMaking is open now.");
        sendMessageToServer("createUser", {"username": currentUser.username})
    };
    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.type === "connectTo")
            document.getElementById("matchMakingCancel").disabled = "disabled"
            document.getElementById("mainTitle").textContent = "Player found ! Setting up the game.."
            ws.close();
            launchClientGame()
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

function onOpen() {
    console.log("WebSocket is open now.");
}

function onReceive(event) {
    const data = JSON.parse(event.data);

    if (data.type === "moveBall")
        moveBalls(data.values);
    else if (data.type === "movePlayer")
        setTopPositionToPlayer(data.values);
    else if (data.type === "launchSpell")
        console.log("launchSpell");
    else if (data.type === "createBall")
        createBall(data.values);
    else if (data.type === "displayScore")
        markPoint(data.values)
    else if (data.type === "renderPage")
        renderPageWithName(data.values["pageName"]);
    else if (data.type === "launchGame")
        launchGame(data.values);
    else if (data.type === "launchClientGame")
        launchClientGame(data.values)
    else
        console.log("Error: Server send a unknown type of data");
}