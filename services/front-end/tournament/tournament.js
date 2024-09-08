import {getHostNameFromURL} from "../scripts/contentLoader.js";

let tournamentWebSocket

export function refreshTournamentList() {
    fetch("api/tournament/get_tournaments/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                console.log(data.from);
                //document.getElementById("tournament").textContent = data.message['from'];
            })
            .catch(error => {
                console.error("Error:", error);
                //document.getElementById("tournament").textContent = "Error submitting tournament.";
            });
}

export function createTournament() {
    console.log("entert create")
    document.cookie = "type=createTournament;max-age=3"
    tournamentWebSocket = new WebSocket(`wss://${getHostNameFromURL()}/ws/tournament`);
    tournamentWebSocket.onopen = function () {
        console.log("on open");
    }

    tournamentWebSocket.onmessage = function () {
        console.log("on msg");
    }
    tournamentWebSocket.onerror = function () {
        console.log("onr error");
    }
    tournamentWebSocket.onclose = function () {
        console.log("on close");
    }
}

export function joinTournament(tournamentId) {
    console.log("entert join")
    document.cookie = "type=joinTournament;max-age=3"
    document.cookie = `tournamentId=${tournamentId};max-age=3`
    tournamentWebSocket = new WebSocket(`wss://${getHostNameFromURL()}/ws/tournament`);
    tournamentWebSocket.onopen = function () {
        console.log("on open j");
    }

    tournamentWebSocket.onmessage = function () {
        console.log("on msg j");
    }
    tournamentWebSocket.onerror = function () {
        console.log("onr error j");
    }
    tournamentWebSocket.onclose = function () {
        console.log("on close j ");
    }


}