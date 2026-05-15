const API = "http://127.0.0.1:5000/api/music/recommend";

async function getMusic() {
    const mood = document.getElementById("moodSelect").value;

    try {
        console.log("Fetching music for mood:", mood);

        const res = await fetch(API, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ mood })
        });

        const data = await res.json();
        console.log("Response:", data);

        if (!data.success) {
            alert("Error getting music");
            return;
        }

        // 🎧 OFFLINE MUSIC
        const player = document.getElementById("player");
        const title = document.getElementById("offlineTitle");

        title.innerText = data.offline.title;

        // IMPORTANT FIX: correct path
        player.src = `assets/music/${data.offline.file}`;
        player.load();   // force reload
        player.play();   // auto play

        // 🌐 ONLINE PLAYLISTS
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