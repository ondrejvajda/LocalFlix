async function fetchMovies() {
  const res = await fetch("/api/movies");

  if (!res.ok) {
    throw new Error("Failed to fetch movies");
  }

  return res.json();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function getMovieProgress(filename) {
  const time = Number(localStorage.getItem(`localflix-progress:${filename}`));
  const duration = Number(localStorage.getItem(`localflix-duration:${filename}`));

  if (!time || !duration || time < 10 || time >= duration - 10) {
    return 0;
  }

  return Math.min(100, Math.round((time / duration) * 100));
}

function renderMovies(grid, movies) {
  if (!movies || movies.length === 0) {
    grid.innerHTML = '<p class="empty-state">No movies found.</p>';
    return;
  }

  grid.innerHTML = movies.map(m => {
    const progress = getMovieProgress(m.filename);
    const posterStyle = m.poster
      ? ` style="background-image: url('/poster/${encodeURIComponent(m.poster)}')"`
      : "";
    const posterClass = m.poster ? " movie-poster" : "";

    return `
      <a class="movie${posterClass}"${posterStyle} href="watch.html?file=${encodeURIComponent(m.filename)}&title=${encodeURIComponent(m.title)}">
        <p class="movie_name">${escapeHtml(m.title)}</p>
        ${progress ? `<span class="movie-progress"><span style="width: ${progress}%"></span></span>` : ""}
      </a>
    `;
  }).join("");
}

function updateMovieCount(count, total) {
  const counter = document.getElementById("libraryCount");
  if (!counter) return;

  if (total === 0) {
    counter.textContent = "No movies in your media folder.";
    return;
  }

  counter.textContent = count === total
    ? `${total} movie${total === 1 ? "" : "s"} in your library`
    : `${count} of ${total} movie${total === 1 ? "" : "s"} shown`;
}

function initWatchProgress(video, filename) {
  const progressKey = `localflix-progress:${filename}`;
  let lastSavedAt = 0;

  video.addEventListener("loadedmetadata", () => {
    const savedTime = Number(localStorage.getItem(progressKey));

    if (video.duration) {
      localStorage.setItem(`localflix-duration:${filename}`, String(video.duration));
    }

    if (savedTime > 10 && savedTime < video.duration - 10) {
      video.currentTime = savedTime;
    }
  });

  video.addEventListener("timeupdate", () => {
    if (!video.duration || video.currentTime - lastSavedAt < 5) {
      return;
    }

    lastSavedAt = video.currentTime;

    if (video.currentTime < video.duration - 10) {
      localStorage.setItem(progressKey, String(video.currentTime));
    }
  });

  video.addEventListener("ended", () => {
    localStorage.removeItem(progressKey);
    localStorage.removeItem(`localflix-duration:${filename}`);
  });
}

async function initMovieGrid() {
  const grid = document.getElementById("movieGrid");
  if (!grid) return;
  const search = document.getElementById("movieSearch");
  const sort = document.getElementById("movieSort");
  const refresh = document.getElementById("refreshMovies");
  let movies = [];

  function applyFilter() {
    const query = search ? search.value.trim().toLowerCase() : "";
    const filtered = query
      ? movies.filter(movie => movie.title.toLowerCase().includes(query))
      : movies;

    const sorted = [...filtered].sort((a, b) => {
      if (sort && sort.value === "za") {
        return b.title.localeCompare(a.title);
      }

      if (sort && sort.value === "newest") {
        return (b.modified || 0) - (a.modified || 0);
      }

      return a.title.localeCompare(b.title);
    });

    renderMovies(grid, sorted);
    updateMovieCount(sorted.length, movies.length);
  }

  async function loadMovies() {
    grid.innerHTML = '<p class="empty-state">Loading movies...</p>';

    if (refresh) {
      refresh.disabled = true;
    }

    try {
      const data = await fetchMovies();
      movies = data.movies || [];
      applyFilter();
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<p class="empty-state">Failed to load movies.</p>';
    } finally {
      if (refresh) {
        refresh.disabled = false;
      }
    }
  }

  if (search) {
    search.addEventListener("input", applyFilter);
  }

  if (sort) {
    sort.addEventListener("change", applyFilter);
  }

  if (refresh) {
    refresh.addEventListener("click", loadMovies);
  }

  loadMovies();
}

function initPlayer() {
  const source = document.getElementById("videoSource");
  if (!source) return;

  const params = new URLSearchParams(location.search);
  const file = params.get("file");
  const title = params.get("title");

  if (title) {
    const h2 = document.querySelector(".watch-title");
    if (h2) h2.textContent = title;
  }

  if (!file) return;

  const video = source.closest("video");
  source.src = `/stream/${encodeURIComponent(file)}`;
  initWatchProgress(video, file);
  video.load();
  video.play().catch(() => {});
}

initMovieGrid();
initPlayer();
