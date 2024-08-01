import {renderPageWithName} from "../scripts/page.js";
import {getClientSide, setTopPositionToPlayer} from "./player.js";
import {createBall, moveBalls} from "./ball.js";
import {getGameId, launchGame, markPoint} from "./game.js";

let ws;

export default function launchClientWebSocket() {
	 ws = new WebSocket("ws://localhost:2605/api/back");
        ws.onopen = onOpen;
        ws.onmessage = onReceive;
}

export function closeWebSocket() {
    ws.close();
}

export function sendMessageToServer(type, values) {
    values["clientSide"] = getClientSide();
    values["gameId"] = getGameId();
    const message = {
        "type": type,
        "values": values
    }
    ws.send(JSON.stringify(message));
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
    else
        console.log("Error: Server send a unknown type of data");
}