# LocalFlix
LocalFlix is a simple local movie library and streaming app built with FastAPI.
It scans a local media folder and provides a Netflix-like web interface for playback.

Step 1:
git clone https://github.com/ondrejvajda/LocalFlix
cd LocalFlix/app

Step 2:
  Windows
    python -m venv .venv
    .\.venv\Scripts\activate
  Linux / macOS
    python3 -m venv .venv
    . .venv/bin/activate

Step 3:
pip install -r requirements.txt

Step 4:
uvicorn main:app --port 8000

Step 5:
http://localhost:8000/ OR http://127.0.0.1:8000/