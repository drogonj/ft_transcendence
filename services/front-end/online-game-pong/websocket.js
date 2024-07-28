import {renderPageWithName} from "../scripts/page.js";
import {createPlayer, getPlayer} from "./player.js";
import {createBall} from "./ball.js";
import {launchGame} from "./game.js";


//Client will send websocket as string, the string will only correspond to an action according to
//a pressed key (for example, arrow up will send "MoveUp")

let ws;

export default function launchClientWebSocket() {
	 ws = new WebSocket("ws://localhost:2605/api/back");
        ws.onopen = onOpen;

        ws.onmessage = onReceive;

        document.addEventListener("click", () => {
            //sendMessageToServer("Hello from client")
        })
}

export function sendMessageToServer(type, values) {
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
    console.log("New message from server of type: " + data.type);
    if (data.type === "moveBall")
        console.log("moveBall");
    else if (data.type === "movePlayer")
        getPlayer().setTopPosition(data.values["topPosition"]);
    else if (data.type === "launchSpell")
        getPlayer().launchSpell(data.values["launchSpell"])
    else if (data.type === "createPlayer")
        createPlayer(data.values);
    else if (data.type === "createBall")
        createBall(data.values);
    else if (data.type === "displayScore")
        getPlayer().displayPoint(data.values);
    else if (data.type === "renderPage")
        renderPageWithName(data.values["pageName"]);
    else if (data.type === "message")
        console.log(data.values["message"]);
    else if (data.type === "launchGame")
        launchGame(data.values);
    else
        console.log("Error: Server send a unknown type of data");
}