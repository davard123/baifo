import sqlite3
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# Railway: __file__ is /app/main.py  →  parent is /app  (writable)
BASE_DIR = Path(__file__).resolve().parent
DB_PATH  = BASE_DIR / "user_data.db"

app = FastAPI(title="礼佛祈愿 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── DB ───────────────────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT    NOT NULL,
                age        INTEGER NOT NULL,
                wish       TEXT    NOT NULL,
                buddha     TEXT    DEFAULT '',
                created_at TEXT    DEFAULT (datetime('now'))
            )
            """
        )
        cols = {r[1] for r in conn.execute("PRAGMA table_info(users)")}
        if "buddha" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN buddha TEXT DEFAULT ''")
        if "created_at" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT NULL")
        if "blessing" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN blessing TEXT DEFAULT ''")


_init_db()


# ── Schemas ───────────────────────────────────────────────────────────────────

class WishIn(BaseModel):
    username: str
    age: int
    wish: str
    buddha: str = ""
    blessing: str = ""   # 祈福池类型，如"求财""求健康"等

    @field_validator("username", "wish")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("不能为空")
        return v.strip()

    @field_validator("age")
    @classmethod
    def positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("年龄必须大于 0")
        return v


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok"}


@app.get("/wishes")
def get_wishes():
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, age, wish, buddha, created_at FROM users ORDER BY id DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@app.post("/wishes")
def create_wish(body: WishIn):
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO users (username, age, wish, buddha, blessing) VALUES (?, ?, ?, ?, ?)",
            (body.username, body.age, body.wish, body.buddha, body.blessing),
        )
    return {"status": "success"}
