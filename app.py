import json
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

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

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="")


@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/detector.html")
def detector():
    return send_from_directory(STATIC_DIR, "detector.html")


@app.route("/api/calibrations", methods=["GET"])
def get_calibrations():
    if CALIBRATIONS_FILE.exists():
        try:
            with CALIBRATIONS_FILE.open("r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        except (json.JSONDecodeError, OSError):
            pass
    return jsonify(DEFAULT_DETECTORS)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
