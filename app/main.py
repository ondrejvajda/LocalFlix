import re  # Regular expressions
from pathlib import Path  # Filesystem path handling
from fastapi import FastAPI, HTTPException, Request  # Core FastAPI classes
from fastapi.staticfiles import StaticFiles  # Serve static files (HTML, CSS, JS)
from fastapi.responses import StreamingResponse, FileResponse  # HTTP responses (streaming, file)
import mimetypes  # Detect MIME types based on file extension

app = FastAPI() # Create server

# Path to static directory (HTML/CSS/JS)
STATIC_DIR = Path(__file__).resolve().parent / "static"
# Path to directory with movies
MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"
# Allowed video file extensions
VIDEO_EXTS = {".mp4", ".mkv", ".webm", ".mov"}
# Allowed poster image extensions
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# Serving static files
app.mount("/static", StaticFiles(directory = STATIC_DIR))

# Home endpoint
@app.get("/")
def home():
    return FileResponse(str(STATIC_DIR / "index.html"))

# Endpoint to test if backend is running
@app.get("/api/health")
def health():
    return {"status": "ok"}

def find_poster(video_path: Path):
  for ext in IMAGE_EXTS:
    poster = video_path.with_suffix(ext)
    if poster.is_file():
      return poster

  return None

# Endpoint for listing movies from the media directory
@app.get("/api/movies")
def movies():
  if not MEDIA_DIR.exists():
      raise HTTPException(status_code=500, detail="Media directory not found")

  items = []
  for f in MEDIA_DIR.iterdir():
    if not f.is_file():
      continue
    if f.suffix.lower() not in VIDEO_EXTS:
      continue

    poster = find_poster(f)

    items.append({        
      "title": f.stem,     
      "filename": f.name,
      "modified": f.stat().st_mtime,
      "poster": poster.name if poster else None
    })

  # Sort movies by title
  items.sort(key=lambda x: x["title"].lower())
  return {"movies": items, "count": len(items)}

# Endpoint for poster images from the media directory
@app.get("/poster/{filename}")
def poster(filename: str):
  media_root = MEDIA_DIR.resolve()
  file_path = (media_root / filename).resolve()

  if media_root not in file_path.parents:
      raise HTTPException(status_code=400, detail="Invalid file path")

  if file_path.suffix.lower() not in IMAGE_EXTS:
      raise HTTPException(status_code=400, detail="Invalid poster type")

  if not file_path.is_file():
      raise HTTPException(status_code=404, detail="Poster not found")

  return FileResponse(str(file_path))

# Video streaming endpoint with HTTP Range support
@app.get("/stream/{filename}")
def stream(filename: str, request: Request):
  CHUNK_SIZE = 1024 * 1024
  DEFAULT_RANGE_SIZE = 4 * 1024 * 1024
  media_root = MEDIA_DIR.resolve()
  file_path = (media_root / filename).resolve()

  if media_root not in file_path.parents:
      raise HTTPException(status_code=400, detail="Invalid file path")

  if not file_path.is_file():
      raise HTTPException(status_code=404, detail="File not found")

  file_size = file_path.stat().st_size
  range_header = request.headers.get("range")
  content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"

  def iterator(start: int = 0, length: int | None = None):
      with open(file_path, "rb") as f:
          f.seek(start)
          remaining = length

          while True:
              if remaining is not None and remaining <= 0:
                  break

              read_size = CHUNK_SIZE if remaining is None else min(CHUNK_SIZE, remaining)
              chunk = f.read(read_size)

              if not chunk:
                  break

              if remaining is not None:
                  remaining -= len(chunk)

              yield chunk

  if not range_header:
      return StreamingResponse(
          iterator(),
          media_type=content_type,
          headers={
              "Content-Length": str(file_size),
              "Accept-Ranges": "bytes",
          },
      )

  m = re.match(r"bytes=(\d+)-(\d*)", range_header)
  if not m:
      raise HTTPException(status_code=416, detail="Invalid Range header")

  start = int(m.group(1))
  end = int(m.group(2)) if m.group(2) else min(start + DEFAULT_RANGE_SIZE, file_size - 1)

  if start >= file_size or end >= file_size or start > end:
      return StreamingResponse(
          iter(()),
          status_code=416,
          headers={"Content-Range": f"bytes */{file_size}"},
      )

  length = end - start + 1

  return StreamingResponse(
      iterator(start=start, length=length),
      status_code=206,
      media_type=content_type,
      headers={
          "Content-Range": f"bytes {start}-{end}/{file_size}",
          "Accept-Ranges": "bytes",
          "Content-Length": str(length),
      },
  )
