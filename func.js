let playlist = [];
let currentIndex = 0;
let player = null;
let autoNextEnabled = true;

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

function getYouTubeId(url) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").split("?")[0];
    }

    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }

    if (u.pathname.includes("/embed/")) {
      return u.pathname.split("/embed/")[1].split("/")[0];
    }

    if (u.pathname.includes("/shorts/")) {
      return u.pathname.split("/shorts/")[1].split("/")[0];
    }

    return null;
  } catch {
    return null;
  }
}

function startPlaylist() {
  const lines = document
    .getElementById("linksInput")
    .value
    .split("\n")
    .map(v => v.trim())
    .filter(v => v);

  if (lines.length === 0) {
    alert("링크를 입력하세요.");
    return;
  }

  playlist = lines
    .map((link, index) => ({
      title: `영상 ${index + 1}`,
      link,
      videoId: getYouTubeId(link)
    }))
    .filter(v => v.videoId);

  if (playlist.length === 0) {
    alert("유효한 유튜브 링크가 없습니다.");
    return;
  }

  document.getElementById("setup").style.display = "none";
  document.getElementById("playerPage").style.display = "block";

  currentIndex = 0;
  player = null;

  createOrLoadPlayer();
  updateInfo();
}

function createOrLoadPlayer() {
  const item = playlist[currentIndex];

  if (!player) {
    player = new YT.Player("youtubePlayer", {
      videoId: item.videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: event => {
          event.target.playVideo();
        },
        onStateChange: onPlayerStateChange
      }
    });
  } else {
    player.loadVideoById(item.videoId);
  }
}

function onPlayerStateChange(event) {
  if (
    event.data === YT.PlayerState.ENDED &&
    autoNextEnabled
  ) {
    nextVideo();
  }
}

function updateInfo() {
  const item = playlist[currentIndex];

  document.getElementById("counter").textContent =
    `${currentIndex + 1} / ${playlist.length}`;

  document.getElementById("title").textContent =
    item.title;

  const percent = Math.round(
    ((currentIndex + 1) / playlist.length) * 100
  );

  document.getElementById("progressBar").style.width =
    percent + "%";

  document.getElementById("progressText").textContent =
    `${percent}% 완료`;

  document.getElementById("prevBtn").disabled =
    currentIndex === 0;

  document.getElementById("openBtn").onclick = () => {
    window.open(item.link, "_blank");
  };
}

function nextVideo() {
  if (currentIndex >= playlist.length - 1) {
    showFinish();
    return;
  }

  currentIndex++;
  updateInfo();
  createOrLoadPlayer();
}

function prevVideo() {
  if (currentIndex <= 0) return;

  currentIndex--;
  updateInfo();
  createOrLoadPlayer();
}

function showFinish() {
  if (player && player.stopVideo) {
    player.stopVideo();
  }

  document.getElementById("playerPage").innerHTML = `
    <div class="finish">
      🎉 오늘 영상 끝!
      <br><br>
      <button id="restartBtn">처음부터 보기</button>
    </div>
  `;

  document
    .getElementById("restartBtn")
    .addEventListener("click", restartPlaylist);
}

function restartPlaylist() {
  currentIndex = 0;
  player = null;

  document.getElementById("playerPage").innerHTML = `
    <div class="topbar">
      <div>
        <div id="counter" class="counter"></div>
        <div id="title" class="title"></div>
      </div>

      <div class="top-buttons">
        <button id="autoBtn">
          자동 다음: ${autoNextEnabled ? "ON" : "OFF"}
        </button>
        <button id="fullscreenBtn">전체 화면 ⛶</button>
      </div>
    </div>

    <div id="videoFrame" class="video-frame">
      <div id="youtubePlayer"></div>
    </div>

    <div class="progress-wrap">
      <div id="progressBar" class="progress-bar"></div>
    </div>

    <div id="progressText" class="progress-text"></div>

    <div class="buttons">
      <button id="prevBtn">◀ 이전</button>
      <button id="openBtn">유튜브에서 열기 ▶</button>
      <button id="nextBtn">다음 ▶</button>
    </div>
  `;

  bindButtons();
  createOrLoadPlayer();
  updateInfo();
}

function bindButtons() {
  document.getElementById("nextBtn").addEventListener("click", nextVideo);
  document.getElementById("prevBtn").addEventListener("click", prevVideo);

  const autoBtn = document.getElementById("autoBtn");

  autoBtn.textContent =
    autoNextEnabled ? "자동 다음: ON" : "자동 다음: OFF";

  autoBtn.style.background =
    autoNextEnabled ? "#00c853" : "#757575";

  autoBtn.addEventListener("click", function () {
    autoNextEnabled = !autoNextEnabled;

    this.textContent = autoNextEnabled
      ? "자동 다음: ON"
      : "자동 다음: OFF";

    this.style.background = autoNextEnabled
      ? "#00c853"
      : "#757575";
  });

  document
    .getElementById("fullscreenBtn")
    .addEventListener("click", function () {
      const videoFrame = document.getElementById("videoFrame");

      if (videoFrame.requestFullscreen) {
        videoFrame.requestFullscreen();
      } else if (videoFrame.webkitRequestFullscreen) {
        videoFrame.webkitRequestFullscreen();
      }
    });
}

document.addEventListener("keydown", function(e) {
  if (document.getElementById("playerPage").style.display !== "block") return;

  if (e.key === "Enter") nextVideo();

  if (e.key === "Backspace") {
    e.preventDefault();
    prevVideo();
  }
});

bindButtons();