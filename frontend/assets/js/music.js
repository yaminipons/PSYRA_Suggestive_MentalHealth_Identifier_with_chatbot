const API = "http://127.0.0.1:5000/api/music/recommend";

async function getMusic() {
    const mood = document.getElementById("moodSelect").value;

    try {
        const res = await fetch(API, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ mood })
        });

        const data = await res.json();
        if (!data.success) {
            alert("Error getting music");
            return;
        }

        // OFFLINE SONG
        document.getElementById("offlineTitle").innerText = data.offline.title;
        document.getElementById("player").src = `assets/music/${data.offline.file}`;

        // ONLINE PLAYLISTS
        const list = document.getElementById("playlistList");
        list.innerHTML = "";

        data.online.forEach(pl => {
            const li = document.createElement("li");
            li.innerHTML = `<a href="${pl.url}" target="_blank">${pl.title}</a>`;
            list.appendChild(li);
        });

    } catch (err) {
        alert("Network error");
        console.log(err);
    }
}
