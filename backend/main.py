
from contextlib import asynccontextmanager
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB = Path(__file__).with_name("app.db")
TABLE = "products"
FIELDS = ["name", "sku", "quantity", "price", "category"]


class RecordIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    sku: str = Field(min_length=1, max_length=50)
    quantity: int = Field(ge=0)
    price: float = Field(ge=0)
    category: str = Field(min_length=1, max_length=50)


class Record(RecordIn):
    id: int


def connect():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def initialize():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                sku TEXT NOT NULL UNIQUE COLLATE NOCASE,
                quantity INTEGER NOT NULL CHECK(quantity >= 0),
                price REAL NOT NULL CHECK(price >= 0),
                category TEXT NOT NULL
            )
            """
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize()
    yield


app = FastAPI(
    title="Inventory Management System API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "project": "Inventory Management System API"
    }


@app.get("/products", response_model=list[Record])
def list_records(q: str | None = None):
    with connect() as conn:
        if q and q.strip():
            where = " OR ".join(
                [f'CAST("{field}" AS TEXT) LIKE ?' for field in FIELDS]
            )
            rows = conn.execute(
                f"SELECT * FROM {TABLE} WHERE {where} ORDER BY id DESC",
                [f"%{q.strip()}%"] * len(FIELDS)
            ).fetchall()
        else:
            rows = conn.execute(
                f"SELECT * FROM {TABLE} ORDER BY id DESC"
            ).fetchall()

    return [dict(row) for row in rows]


@app.post("/products", response_model=Record, status_code=201)
def create_record(payload: RecordIn):
    values = payload.model_dump()
    columns = ", ".join([f'"{field}"' for field in FIELDS])
    placeholders = ", ".join(["?"] * len(FIELDS))

    try:
        with connect() as conn:
            cursor = conn.execute(
                f"INSERT INTO {TABLE} ({columns}) VALUES ({placeholders})",
                [values[field] for field in FIELDS]
            )
            row = conn.execute(
                f"SELECT * FROM {TABLE} WHERE id = ?",
                (cursor.lastrowid,)
            ).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(409, "SKU already exists")

    return dict(row)


@app.get("/products/{record_id}", response_model=Record)
def get_record(record_id: int):
    with connect() as conn:
        row = conn.execute(
            f"SELECT * FROM {TABLE} WHERE id = ?",
            (record_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(404, "Product not found")

    return dict(row)


@app.put("/products/{record_id}", response_model=Record)
def update_record(record_id: int, payload: RecordIn):
    values = payload.model_dump()
    updates = ", ".join([f'"{field}" = ?' for field in FIELDS])

    try:
        with connect() as conn:
            cursor = conn.execute(
                f"UPDATE {TABLE} SET {updates} WHERE id = ?",
                [values[field] for field in FIELDS] + [record_id]
            )

            if cursor.rowcount == 0:
                raise HTTPException(404, "Product not found")

            row = conn.execute(
                f"SELECT * FROM {TABLE} WHERE id = ?",
                (record_id,)
            ).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(409, "SKU already exists")

    return dict(row)


@app.delete("/products/{record_id}", status_code=204)
def delete_record(record_id: int):
    with connect() as conn:
        cursor = conn.execute(
            f"DELETE FROM {TABLE} WHERE id = ?",
            (record_id,)
        )

    if cursor.rowcount == 0:
        raise HTTPException(404, "Product not found")
