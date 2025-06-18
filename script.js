const trackList = [
    { name: "SENSITIVE", artist: "KR$NA ft.SEEDHE MAUT", image: "files/4.jpeg", path: "files/Sensitive.mp3" },
    { name: "RED", artist: "SEEDHE MAUT", image: "files/3.jpeg", path: "files/Red.mp3" },
    { name: "RUN IT UP", artist: "HANUMANKIND", image: "files/6.png", path: "files/Run It Up.mp3" },
    { name: "WITHOUT ME", artist: "EMINEM", image: "files/7.jpeg", path: "files/without me.mp3" },
    { name: "NOT LIKE US", artist: "KENDRICK LAMAR", image: "files/8.jpg", path: "files/not like us.mp3" },
    { name: "NO CAP", artist: "KR$NA", image: "files/5.jpeg", path: "files/No Cap.mp3" },
    { name: "HOLA AMIGO", artist: "KR$NA ft. SEEDHE MAUT", image: "files/1.jpg", path: "files/Hola Amigo.mp3" },
    { name: "11K", artist: "SEEDHE MAUT", image: "files/2.webp", path: "files/11K.mp3" },
];

let audio = new Audio();
let trackIndex = parseInt(localStorage.getItem("trackIndex")) || 0;
let isPlaying = JSON.parse(localStorage.getItem("trackIsPlaying")) || false;
let isShuffle = JSON.parse(localStorage.getItem("trackShuffle")) || false;
let savedTime = parseFloat(localStorage.getItem("trackTime")) || 0;

const trackArt = document.querySelector(".track-art");
const trackName = document.querySelector(".track-name");
const trackArtist = document.querySelector(".track-artist");
const trackImage = document.getElementById("track-image");
const playBtn = document.querySelector(".playpause-track");
const nextBtn = document.querySelector(".next-track");
const prevBtn = document.querySelector(".prev-track");
const shuffleBtn = document.querySelector(".shuffle-track");
const volumeSlider = document.getElementById("volume-slider");
const seekSlider = document.getElementById("seek-slider");
const currentTimeLabel = document.getElementById("current-time");
const totalTimeLabel = document.getElementById("total-time");
const volumeValueLabel = document.getElementById("volume-value");

audio.volume = parseFloat(localStorage.getItem("trackVolume")) || 1;
volumeSlider.value = audio.volume;
volumeValueLabel.textContent = `${Math.round(audio.volume * 100)}%`;

if (isShuffle) shuffleBtn.classList.add("active");

function loadTrack(index) {
    const track = trackList[index];
    audio.src = track.path;
    trackName.textContent = track.name;
    trackArtist.textContent = track.artist;
    trackImage.src = track.image;

    audio.load();

    audio.addEventListener("loadeddata", () => {
        if (!isNaN(savedTime) && savedTime > 0) {
            audio.currentTime = savedTime;
        }

        updateSliderProgress(seekSlider);
        updateSliderProgress(volumeSlider);

        isPlaying ? playTrack() : pauseTrack();
        scrollToCurrentTrack();

    }, { once: true });
}

function saveState() {
    localStorage.setItem("trackIndex", trackIndex);
    localStorage.setItem("trackTime", audio.currentTime);
    localStorage.setItem("trackVolume", audio.volume);
    localStorage.setItem("trackShuffle", JSON.stringify(isShuffle));
    localStorage.setItem("trackIsPlaying", JSON.stringify(isPlaying));
}

function playTrack() {
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    trackArt.classList.add("playing");
    highlightCurrentTrack();
    saveState();
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    trackArt.classList.remove("playing");
    saveState();
}

function nextTrack() {
    trackIndex = isShuffle
        ? Math.floor(Math.random() * trackList.length)
        : (trackIndex + 1) % trackList.length;
    savedTime = 0;
    loadTrack(trackIndex);
    playTrack();
    scrollToCurrentTrack();

}

function prevTrack() {
    if (audio.currentTime > 5) {
        audio.currentTime = 0;
    } else {
        trackIndex = (trackIndex - 1 + trackList.length) % trackList.length;
        savedTime = 0;
        loadTrack(trackIndex);
        playTrack();
        scrollToCurrentTrack();
    }
}

function seekTo() {
    const seekTo = audio.duration * (seekSlider.value / 100);
    audio.currentTime = seekTo;
    saveState();
}

let lastSave = 0;
function updateSeekBar() {
    if (!isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;
        seekSlider.value = progress;
        updateSliderProgress(seekSlider);
        currentTimeLabel.textContent = formatTime(audio.currentTime);
        totalTimeLabel.textContent = formatTime(audio.duration);

        const now = Date.now();
        if (now - lastSave > 2000) {
            saveState();
            lastSave = now;
        }
    }
}

playBtn.addEventListener("click", () => {
    if (typeof audioCtx !== "undefined" && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    isPlaying ? pauseTrack() : playTrack();
});

nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);
volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    volumeValueLabel.textContent = `${Math.round(audio.volume * 100)}%`;
    updateSliderProgress(volumeSlider);
    saveState();
});
seekSlider.addEventListener("input", seekTo);
audio.addEventListener("timeupdate", updateSeekBar);
audio.addEventListener("ended", nextTrack);


shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
    saveState();
});

function createPlaylist() {
    const playlist = document.getElementById("playlist");
    playlist.innerHTML = "";
    trackList.forEach((track, index) => {
        const card = document.createElement("div");
        card.className = "song-card";
        if (index === trackIndex) card.classList.add("active");
        card.innerHTML = `
            <img src="${track.image}" alt="${track.name}">
            <div class="song-info">
                <div class="song-title">${track.name}</div>
                <div class="song-artist">${track.artist}</div>
            </div>`;
        card.addEventListener("click", () => {
            trackIndex = index;
            savedTime = 0;
            loadTrack(trackIndex);
            playTrack();
            highlightCurrentTrack();
            scrollToCurrentTrack();
        });
        playlist.appendChild(card);
    });
}

function highlightCurrentTrack() {
    document.querySelectorAll(".song-card").forEach((card, idx) => {
        card.classList.toggle("active", idx === trackIndex);
    });
}

function scrollToCurrentTrack() {
    const activeCard = document.querySelector(".song-card.active");
    const container = document.getElementById("playlist");

    if (activeCard && container) {
        const cardTop = activeCard.offsetTop;
        const cardHeight = activeCard.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollTop = cardTop - (containerHeight / 2) + (cardHeight / 2);

        container.scrollTo({
            top: scrollTop,
            behavior: "smooth"
        });
    }
}


function updateSliderProgress(slider) {
    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.setProperty("--value", `${value}%`);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

// === Audio Visualizer ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 64;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const bars = Array.from(document.querySelectorAll(".bar"));


// === Mute Button ===
const muteBtn = document.querySelector(".mute-track");
let isMuted = false;
muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.innerHTML = isMuted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
    muteBtn.classList.toggle("muted", isMuted);
});



function spawnBeatEmoji(x, y) {
    const emojiList = [
        "🎧","🔥", "🎶", "💥",
        "📀", "🎵", "😎", "🤘", "🥁"
    ];
    const emoji = document.createElement("div");
    emoji.className = "beat-emoji";
    emoji.textContent = emojiList[Math.floor(Math.random() * emojiList.length)];
    emoji.style.left = `${x}px`;
    emoji.style.top = `${y}px`;
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 1000);
}
function animateBeats() {
    requestAnimationFrame(animateBeats);
    analyser.getByteFrequencyData(dataArray);

    let maxVal = 0;
    bars.forEach((bar, i) => {
        const value = dataArray[i * 2];
        maxVal = Math.max(maxVal, value);
        bar.style.height = `${Math.max(10, value / 2)}px`;
    });

    if (maxVal > 200 && Math.random() > 0.7) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        spawnBeatEmoji(x, y);
    }
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault(); // Prevent scrolling when pressing space
        if (typeof audioCtx !== "undefined" && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        isPlaying ? pauseTrack() : playTrack();
    }
});

// And remove the scrollToCurrentTrack function if you want

// === Final Load ===
createPlaylist();
loadTrack(trackIndex);
scrollToCurrentTrack();
animateBeats(); // Start the beat emoji animation

