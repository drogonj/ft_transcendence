export function test() {
    const tournamentName = "exemple tour"

    fetch("https://back-tournament:2610/ws/tournament", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tournament_name: tournamentName }),
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("tournament").textContent = data.message;
            })
            .catch(error => {
                console.error("Error:", error);
                document.getElementById("tournament").textContent = "Error submitting tournament.";
            });
}