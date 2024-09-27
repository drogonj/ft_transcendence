import {getHostNameFromURL, navigateTo} from "./contentLoader.js";
import {currentUser, getUserFromId} from "./auth.js";
import {launchClientGame} from "../online-game-pong/websocket.js";

let tournamentWebSocket;

export function refreshTournamentList() {
    fetch("api/tournament/get_tournaments/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("tournamentList").innerHTML = '';
                data.forEach((value) => {
                    const newDiv = document.createElement('div');
                    const newDivHeader = document.createElement('div');
                    const newDivButton = document.createElement('button');

                    newDivButton.classList.add("joinTournament");
                    newDivButton.classList.add("tournamentButton");
                    newDivButton.textContent = `Join the actual ${value['playersNumber']}/10 players`;
                    if (parseInt(value['playersNumber']) >= 10)
                        newDivButton.disabled = true;
                    else {
                        newDivButton.addEventListener("click", event => {
                            joinTournament(value["tournamentId"]);
                        })
                    }

                    newDiv.classList.add("tournamentCard");
                    newDiv.textContent = `Tournament of ${value['hostUsername']}`;
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
    document.cookie = "type=createTournament;max-age=3";
    initWebSocketFunc();
}

export function joinTournament(tournamentId) {
    document.cookie = "type=joinTournament;max-age=3";
    document.cookie = `tournamentId=${tournamentId};max-age=3`;
    initWebSocketFunc();
}

function startTournament() {
    sendMessageToTournamentServer("launchTournament", {});
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
        else if (data.type === "connectTo") {
            tournamentWebSocket.close();
            launchClientGame()
        } else if (data.type === "error") {
            tournamentWebSocket.close();
            navigateTo('/tournament', true);
            window.alert(data.values["message"]);
        } else if (data.type === "endTournament") {
            tournamentWebSocket.close()
            navigateTo('/tournament', true);
            window.alert("You win the tournament ^^");
        }
    }
}

export function refreshTournamentLobby(playersList) {
    let hostPlayer;

    document.getElementById("playerList").innerHTML = ''
    playersList.forEach((values) => {
        const newDiv = document.createElement('div');
        const newDivUsername = document.createElement('div');
        const newImg = document.createElement('img');

        newDiv.classList.add("playerCard");

        newDivUsername.classList.add("playerUsername");
        newDivUsername.textContent = `${values["username"]}`;
        if (values["host"]) {
            newDivUsername.style.color = "#FFD700";
            hostPlayer = values;
        }

        getUserFromId(values["playerId"]).then((promiseValues) => {
            newImg.src = promiseValues.avatar;
        });

        newDiv.append(newImg);
        newDiv.append(newDivUsername);

        document.getElementById("playerList").appendChild(newDiv);
    });


    if (hostPlayer && currentUser.user_id === parseInt(hostPlayer["playerId"])) {
        const newDivButton = document.createElement('button');

        newDivButton.classList.add("tournamentButton");
        newDivButton.id = "startTournament"
        newDivButton.textContent = `Start tournament`;
        newDivButton.addEventListener("click", event => {
            startTournament();
        })
        //todo the value is 4 but for testing I set 2. (same in back)
        if (playersList.length < 2)
            newDivButton.disabled = true

        const startDivButton = document.getElementById("startTournament");
        if (startDivButton)
            startDivButton.replaceWith(newDivButton);
        else
            document.getElementById("footerTournament").prepend(newDivButton);
    }
}

export function closeTournamentWebSocket() {
    tournamentWebSocket.close();
}

function sendMessageToTournamentServer(type, values) {
    const message = {
        "type": type,
        "values": values,
    }
    tournamentWebSocket.send(JSON.stringify(message));
}

export function isTournamentWebSocketBind() {
    return tournamentWebSocket && tournamentWebSocket.readyState === WebSocket.OPEN;
}