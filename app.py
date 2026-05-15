import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from analysis import io as csv_io

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
CALIBRATIONS_FILE = DATA_DIR / "calibrations.json"

# Fallback when data/calibrations.json is missing or unreadable.
# Kept in sync with DEFAULT_DETECTORS in static/data.js.
DEFAULT_DETECTORS = [
    {"id": 0,  "status": "ok",  "fit": {"a": 4.42, "sigA": 0.36, "b": 4, "sigB": 3, "r2": 0.9987, "rms": 1.8, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²²⁸Th"}]},
    {"id": 1,  "status": "ok",  "fit": {"a": 4.38, "sigA": 0.29, "b": 5, "sigB": 2, "r2": 0.9985, "rms": 1.9, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "⁶⁰Co"}]},
    {"id": 2,  "status": "ok",  "fit": {"a": 4.51, "sigA": 0.41, "b": 3, "sigB": 3, "r2": 0.9978, "rms": 2.0, "points": 4}, "sources": [{"isotope": "²²⁸Th"}, {"isotope": "⁶⁰Co"}]},
    {"id": 3,  "status": "ok",  "fit": {"a": 4.19, "sigA": 0.45, "b": 7, "sigB": 4, "r2": 0.9971, "rms": 2.3, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²⁰⁴Bi"}]},
    {"id": 4,  "status": "ok",  "fit": {"a": 4.11, "sigA": 0.42, "b": 6, "sigB": 4, "r2": 0.9971, "rms": 2.3, "points": 4}, "sources": [{"isotope": "⁶⁰Co"}, {"isotope": "¹³⁷Cs"}]},
    {"id": 5,  "status": "ok",  "fit": {"a": 4.27, "sigA": 0.33, "b": 5, "sigB": 3, "r2": 0.9983, "rms": 1.9, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²²⁸Th"}]},
    {"id": 6,  "status": "ok",  "fit": {"a": 4.48, "sigA": 0.31, "b": 4, "sigB": 2, "r2": 0.9988, "rms": 1.7, "points": 4}, "sources": [{"isotope": "⁶⁰Co"}, {"isotope": "²²⁸Th"}]},
    {"id": 7,  "status": "ok",  "fit": {"a": 4.05, "sigA": 0.50, "b": 8, "sigB": 5, "r2": 0.9962, "rms": 2.5, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²⁰⁴Bi"}]},
    {"id": 8,  "status": "ok",  "fit": {"a": 4.33, "sigA": 0.28, "b": 3, "sigB": 2, "r2": 0.9990, "rms": 1.6, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "⁶⁰Co"}]},
    {"id": 9,  "status": "ok",  "fit": {"a": 4.21, "sigA": 0.39, "b": 6, "sigB": 3, "r2": 0.9980, "rms": 2.0, "points": 4}, "sources": [{"isotope": "²²⁸Th"}, {"isotope": "²⁰⁴Bi"}]},
    {"id": 10, "status": "old", "fit": {"a": 4.46, "sigA": 0.35, "b": 4, "sigB": 3, "r2": 0.9982, "rms": 1.9, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²²⁸Th"}]},
    {"id": 11, "status": "old", "fit": {"a": 4.16, "sigA": 0.44, "b": 7, "sigB": 4, "r2": 0.9969, "rms": 2.4, "points": 4}, "sources": [{"isotope": "⁶⁰Co"}, {"isotope": "¹³⁷Cs"}]},
    {"id": 12, "status": "old", "fit": {"a": 4.29, "sigA": 0.37, "b": 5, "sigB": 3, "r2": 0.9979, "rms": 2.1, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²²⁸Th"}]},
    {"id": 13, "status": "old", "fit": {"a": 4.40, "sigA": 0.32, "b": 4, "sigB": 2, "r2": 0.9987, "rms": 1.7, "points": 4}, "sources": [{"isotope": "⁶⁰Co"}, {"isotope": "²⁰⁴Bi"}]},
    {"id": 14, "status": "old", "fit": {"a": 4.08, "sigA": 0.48, "b": 8, "sigB": 5, "r2": 0.9964, "rms": 2.5, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "²²⁸Th"}]},
    {"id": 15, "status": "old", "fit": {"a": 4.24, "sigA": 0.40, "b": 6, "sigB": 3, "r2": 0.9976, "rms": 2.2, "points": 4}, "sources": [{"isotope": "¹³⁷Cs"}, {"isotope": "⁶⁰Co"}, {"isotope": "²²⁸Th"}]},
]

app = FastAPI(title="X17 Scintillateur Calibration")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


VALID_KINDS = {"nai", "up", "down"}


@app.post("/api/detectors/{det_id}/sources/{src_idx}/upload/{kind}")
async def upload_csv(det_id: int, src_idx: int, kind: str, file: UploadFile):
    """Receive one CSV (NaI, U, or D) for a given source of a given detector.

    The file is parsed and validated immediately so the user gets feedback in
    the upload zone. Storage / fitting will plug in here later.
    """
    if kind not in VALID_KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(VALID_KINDS)}")
    try:
        df = csv_io.parse_csv(file.file)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {
        "status": "ok",
        "filename": file.filename,
        "rows": len(df),
        "channel_min": float(df["channel"].min()),
        "channel_max": float(df["channel"].max()),
    }


@app.get("/api/calibrations")
def get_calibrations():
    if CALIBRATIONS_FILE.exists():
        try:
            with CALIBRATIONS_FILE.open("r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return DEFAULT_DETECTORS


# Mounted last so it doesn't shadow the API routes above.
# `html=True` lets `/detector.html` (and any other static asset) resolve directly.
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=True)
