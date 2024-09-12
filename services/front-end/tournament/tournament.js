import {getHostNameFromURL, navigateTo} from "../scripts/contentLoader.js";
import {getUserFromId} from "../scripts/auth.js";

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
                    newDivButton.textContent = `Join the actual ${value['playersNumber']}/10 players`
                    if (parseInt(value['playersNumber']) >= 10)
                        newDivButton.disabled = true
                    else {
                        newDivButton.addEventListener("click", event => {
                            joinTournament(value["tournamentId"])
                        })
                    }

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
    document.cookie = "type=createTournament;max-age=3"
    initWebSocketFunc();
}

export function joinTournament(tournamentId) {
    document.cookie = "type=joinTournament;max-age=3"
    document.cookie = `tournamentId=${tournamentId};max-age=3`
    initWebSocketFunc();
}

function initWebSocketFunc() {
    tournamentWebSocket = new WebSocket(`wss://${getHostNameFromURL()}/ws/tournament`);
    tournamentWebSocket.onopen = function () {
        navigateTo('/tournament-lobby', true);
    }

    tournamentWebSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === "refreshLobby")
            refreshTournamentLobby(JSON.parse(data.values));
    }
}

export function refreshTournamentLobby(playersList) {

    document.getElementById("playerList").innerHTML = ''
    playersList.forEach((values) => {
        const newDiv = document.createElement('div');
        const newDivUsername = document.createElement('div');
        const newImg = document.createElement('img');

        newDiv.classList.add("playerCard");

        newDivUsername.classList.add("playerUsername");
        newDivUsername.textContent = `${values["username"]}`;

        getUserFromId(values["playerId"]).then((promiseValues) => {
            newImg.src = promiseValues.avatar;
        });

        newDiv.append(newImg);
        newDiv.append(newDivUsername);

        document.getElementById("playerList").appendChild(newDiv);
    });
}

export function closeTournamentWebSocket() {
    tournamentWebSocket.close();
}