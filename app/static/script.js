async function fetchMovies() {
  const res = await fetch("/api/movies");

  if (!res.ok) {
    throw new Error("Failed to fetch movies");
  }

  return res.json();
}

function renderMovies(grid, movies) {
  if (!movies || movies.length === 0) {
    grid.textContent = "No movies found.";
    return;
  }

  grid.innerHTML = movies.map(m => `
    <a class="movie" href="watch.html?file=${encodeURIComponent(m.filename)}&title=${encodeURIComponent(m.title)}">
      <p class="movie_name">${m.title}</p>
    </a>
  `).join("");
}

async function initMovieGrid() {
  const grid = document.getElementById("movieGrid");
  if (!grid) return;

  try {
    const data = await fetchMovies();
    renderMovies(grid, data.movies);
  } catch (err) {
    console.error(err);
    grid.textContent = "Failed to load movies.";
  }
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
  video.load();
}

initMovieGrid();
initPlayer();
