import os
import psycopg
from psycopg import sql
from psycopg.adapt import PyDecimal  # unused but imported for type coherence
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field_validator

# PostgreSQL connection via Supabase
DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable not set")

app = FastAPI(title="礼佛祈愿 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── DB ───────────────────────────────────────────────────────────────────────

def _get_conn():
    return psycopg.connect(DATABASE_URL, row_factory=psycopg.rows.row_factory)


def _dict_row(row):
    """Convert psycopg Row to dict with string keys."""
    return dict(zip(row.keys(), row))


def _init_db() -> None:
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id         BIGSERIAL PRIMARY KEY,
                username   TEXT    NOT NULL,
                age        INTEGER NOT NULL,
                wish       TEXT    NOT NULL,
                buddha     TEXT    DEFAULT '',
                blessing   TEXT    DEFAULT '',
                target     TEXT    DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add blessing and target columns if they don't exist (old SQLite data migration)
        try:
            conn.execute("ALTER TABLE users ADD COLUMN blessing TEXT DEFAULT ''")
        except psycopg.errors.DuplicateColumn:
            pass
        try:
            conn.execute("ALTER TABLE users ADD COLUMN target TEXT DEFAULT ''")
        except psycopg.errors.DuplicateColumn:
            pass

        conn.execute("""
            CREATE TABLE IF NOT EXISTS ancestor_wishes (
                id             BIGSERIAL PRIMARY KEY,
                username       TEXT    NOT NULL,
                age            INTEGER NOT NULL,
                ancestor       TEXT    NOT NULL,
                ancestor_name  TEXT    NOT NULL,
                relationship   TEXT    NOT NULL,
                wish           TEXT    NOT NULL,
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


_init_db()


# ── Schemas ───────────────────────────────────────────────────────────────────

class WishIn(BaseModel):
    username: str
    age: int = 30
    wish: str
    buddha: str = ""
    blessing: str = ""
    target: str = ""

    @field_validator("username", "wish")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("不能为空")
        return v.strip()


class AncestorWishIn(BaseModel):
    username: str
    age: int = 30
    ancestor: str = ""
    ancestor_name: str = ""
    relationship: str = ""
    wish: str = ""

    @field_validator("username", "wish")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("不能为空")
        return v.strip()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok"}


@app.get("/wishes")
def get_wishes():
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, age, wish, buddha, blessing, target, created_at FROM users ORDER BY id DESC"
        ).fetchall()
    return [_dict_row(r) for r in rows]


@app.post("/wishes")
def create_wish(body: WishIn):
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO users (username, age, wish, buddha, blessing, target) VALUES (%s, %s, %s, %s, %s, %s)",
            (body.username, body.age, body.wish, body.buddha, body.blessing, body.target),
        )
    return {"status": "success"}


@app.get("/ancestor-wishes")
def get_ancestor_wishes():
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, age, ancestor, ancestor_name, relationship, wish, created_at FROM ancestor_wishes ORDER BY id DESC"
        ).fetchall()
    return [_dict_row(r) for r in rows]


@app.post("/ancestor-wishes")
def create_ancestor_wish(body: AncestorWishIn):
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO ancestor_wishes (username, age, ancestor, ancestor_name, relationship, wish) VALUES (%s, %s, %s, %s, %s, %s)",
            (body.username, body.age, body.ancestor, body.ancestor_name, body.relationship, body.wish),
        )
    return {"status": "success"}
