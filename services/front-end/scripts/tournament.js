import {getHostNameFromURL, navigateTo} from "./contentLoader.js";
import {currentUser, getUserFromId} from "./auth.js";
import {launchClientGame} from "../online-game-pong/websocket.js";
import {sendGameMessage} from "./chat.js";

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
                    newDivButton.textContent = `Join the actual ${value['playersNumber']}/20 players`;
                    newDivButton.addEventListener("click", event => {
                        joinTournament(value["tournamentId"]);
                    })

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
    initWebSocketFunc("action=createTournament");
}

export function joinTournament(tournamentId) {
    initWebSocketFunc(`action=joinTournament&tournamentId=${tournamentId}`);
}

function startTournament() {
    sendMessageToTournamentServer("launchTournament", {});
}

function initWebSocketFunc(queryString) {
    tournamentWebSocket = new WebSocket(`wss://${getHostNameFromURL()}/ws/tournament?${queryString}`);
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
        } else if (data.type === "info") {
            sendGameMessage(data.values["message"]);
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
        const newImgStatement = document.createElement('img');

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

        newImgStatement.classList.add("statementImg");
        newImgStatement.src = "../../assets/images/sablier.gif"
        if (values["statement"] === 1)
            newImgStatement.src = "../../assets/images/clavier.gif"

        newDiv.append(newImg);
        newDiv.append(newDivUsername);
        newDiv.append(newImgStatement);

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