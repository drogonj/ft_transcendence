import createPlayer from "./player.js";
import {renderPageWithName} from "../scripts/page.js";

let ws;

export default function launchClientWebSocket() {
	 ws = new WebSocket("ws://localhost:2605/api/back");
        ws.onopen = onOpen;

        ws.onmessage = onReceive;

        document.addEventListener("click", () => {
            sendMessageToServer("Hello from client")
        })
}

export function sendMessageToServer(message) {
    ws.send(message);
}

function onOpen() {
    console.log("WebSocket is open now.");
            ws.send("Hello, server!");
}

function onReceive(event) {
    const data = JSON.parse(event.data);
    console.log("New message from server of type: " + data.type);
    if (data.type === "moveBall")
        console.log("moveBall");
    else if (data.type === "createPlayer")
        createPlayer(data);
    else if (data.type === "renderPage")
        renderPageWithName(data.values["pageName"]);
    else if (data.type === "movePlayer")
        console.log("movePlayer");
    else if (data.type === "setTextContent")
        console.log("textContent");
    else if (data.type === "message")
        console.log(data.values["message"]);
    else
        console.log("Error: Server send a unknown type of data");
}