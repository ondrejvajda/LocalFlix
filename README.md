# LocalFlix

LocalFlix is a simple local movie library and streaming application built with FastAPI.

The application scans a local media directory and provides a web interface for browsing and streaming video content.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ondrejvajda/LocalFlix.git
cd LocalFlix/app
```

### 2. Create a virtual environment

#### Windows

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

#### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the server

```bash
uvicorn main:app --port 8000
```

### 5. Open the application

```text
http://localhost:8000
```

or

```text
http://127.0.0.1:8000
```

## Project Structure

```text
LocalFlix/
├── app/
│   ├── static/
│   ├── main.py
│   └── requirements.txt
├── media/
├── README.md
└── LICENSE
```

## Media Folder

Place your video files inside the `media` directory.

Example:

```text
media/
├── Movie1.mp4
├── Movie2.mkv
└── Movie3.mov
```

## License

This project is licensed under the MIT License.
