import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "user_data.db"

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_users_table() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                age INTEGER NOT NULL,
                wish TEXT NOT NULL
            )
            """
        )


@app.get("/get_all_submitted")
@app.get("/api/get_all_submitted")
def get_all_submitted():
    with get_connection() as conn:
        users = conn.execute(
            "SELECT id, username, age, wish FROM users ORDER BY id DESC"
        ).fetchall()

    return jsonify([dict(user) for user in users])


@app.post("/submit")
@app.post("/api/submit")
def submit():
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()
    wish = str(data.get("wish", "")).strip()
    age_raw = str(data.get("age", "")).strip()

    if not username or not wish or not age_raw:
        return jsonify({"status": "error", "message": "请把用户名、年龄和愿望填写完整。"}), 400

    try:
        age = int(age_raw)
    except ValueError:
        return jsonify({"status": "error", "message": "年龄必须是数字。"}), 400

    if age <= 0:
        return jsonify({"status": "error", "message": "年龄必须大于 0。"}), 400

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO users (username, age, wish) VALUES (?, ?, ?)",
            (username, age, wish),
        )

    return jsonify({"status": "success"})


@app.get("/")
@app.get("/<path:filename>")
def serve_static(filename="index.html"):
    return send_from_directory(BASE_DIR, filename)


create_users_table()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
