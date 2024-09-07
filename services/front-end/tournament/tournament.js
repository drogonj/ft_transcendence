export function test() {
    fetch("api/tournament/get_tournaments/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                document.getElementById("tournament").textContent = data.message['from'];
            })
            .catch(error => {
                console.error("Error:", error);
                document.getElementById("tournament").textContent = "Error submitting tournament.";
            });
}