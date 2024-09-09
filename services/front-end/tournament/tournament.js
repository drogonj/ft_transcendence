import {getHostNameFromURL, navigateTo} from "../scripts/contentLoader.js";

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
                document.getElementById("tournamentList").innerHTML = ''
                data.forEach((value) => {
                    const newDiv = document.createElement('div');
                    const newDivHeader = document.createElement('div');
                    const newDivButton = document.createElement('button');

                    newDivButton.classList.add("joinTournament");
                    newDivButton.classList.add("tournamentButton");
                    newDivButton.textContent = `Join the actual ${value['playersNumber']} players`
                    newDivButton.addEventListener("click", event => {
                        joinTournament(value["tournamentId"])
                    })

                    newDiv.classList.add("tournamentCard");
                    newDiv.textContent = `Tournament of ${value['hostUsername']}`
                    newDiv.append(newDivHeader);
                    newDiv.append(newDivButton);

                    document.getElementById("tournamentList").appendChild(newDiv);
                });
                if (document.getElementById("tournamentList").innerHTML === "")
                    document.getElementById("tournamentList").innerHTML = '<p1>There is no tournament</p1>'
            })
            .catch(error => {
                console.error("Error:", error);
            });
}

export function createTournament() {
    console.log("entert create")
    document.cookie = "type=createTournament;max-age=3"
    tournamentWebSocket = new WebSocket(`wss://${getHostNameFromURL()}/ws/tournament`);
    tournamentWebSocket.onopen = function () {
        console.log("on open");
        navigateTo('/tournament-lobby', true);
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

export function refreshTournamentLobby() {

}

export function closeTournamentWebSocket() {
    tournamentWebSocket.close();
}