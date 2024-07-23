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

function sendMessageToServer(message) {
    ws.send(message);
}

function onOpen() {
    console.log("WebSocket is open now.");
            ws.send("Hello, server!");
}

function onReceive(event) {
    const data = JSON.parse(event.data)
    console.log("You receveid a message from server: \n" + data);
    if (data.type === "createPlayer")
        createPlayer(data)
    else if (data.type === "renderPage")
        renderPageWithName(data.values["pageName"])
}