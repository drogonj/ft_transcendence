alertBox = document.getElementsByClassName("alert")[0];

const sendData = async () => {
    console.log("Try to send data")
    const data = {
        pseudo: document.getElementsByTagName("input")[0].value,
        level: 0,
        elo: 0
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/receive-data/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.status === "error")
            alertBoxDisplay("Username already used");
        else
            alertBoxDisplay("Successfully registered !");
    } catch (error) {
        console.error('Error:', error);
    }
};

function alertBoxDisplay(msg) {
    alertBox.textContent = msg;
    alertBox.style.display = "flex"
}

document.getElementsByTagName("button")[0].addEventListener("click", () => {
    sendData();
})

document.getElementsByClassName("alert")[0].addEventListener("click", () => {
    alertBox.style.display = "none"
})