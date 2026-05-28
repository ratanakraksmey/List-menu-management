from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import sqlite3
import uuid
import os
 
app = FastAPI(title="Menu API")
 
DB_PATH = "menu.db"
 
# ── Database Setup ──────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
 
def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT DEFAULT ''
        )
    """)
    # Seed only if table is empty
    count = conn.execute("SELECT COUNT(*) FROM menu_items").fetchone()[0]
    if count == 0:
        seed = [
            (str(uuid.uuid4()), "Truffle Arancini", "Starters", 14.00, "Crispy risotto balls with black truffle & parmesan"),
            (str(uuid.uuid4()), "Burrata & Heirloom", "Starters", 16.00, "Creamy burrata with heirloom tomatoes & basil oil"),
            (str(uuid.uuid4()), "Seared Duck Breast", "Mains", 38.00, "Cherry jus, celeriac purée, wilted greens"),
            (str(uuid.uuid4()), "Lobster Linguine", "Mains", 44.00, "Boston lobster, chilli, cherry tomato, fresh pasta"),
            (str(uuid.uuid4()), "Wagyu Striploin", "Mains", 68.00, "200g A5 wagyu, truffle butter, bone marrow jus"),
            (str(uuid.uuid4()), "Chocolate Fondant", "Desserts", 12.00, "Warm valrhona chocolate, salted caramel ice cream"),
            (str(uuid.uuid4()), "Crème Brûlée", "Desserts", 11.00, "Classic vanilla bean with caramelised sugar crust"),
            (str(uuid.uuid4()), "Château Margaux 2018", "Drinks", 22.00, "Bold Bordeaux with dark fruit & cedar notes"),
            (str(uuid.uuid4()), "Elderflower Spritz", "Drinks", 9.00, "Elderflower, prosecco, fresh mint & cucumber"),
        ]
        conn.executemany(
            "INSERT INTO menu_items (id, name, category, price, description) VALUES (?, ?, ?, ?, ?)",
            seed
        )
    conn.commit()
    conn.close()
 
init_db()
 
 
# ── Model ───────────────────────────────────
class MenuItem(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = ""
 
 
# ── Routes ──────────────────────────────────
@app.get("/api/menu")
def get_menu():
    conn = get_db()
    rows = conn.execute("SELECT * FROM menu_items").fetchall()
    conn.close()
    return [dict(row) for row in rows]
 
 
@app.get("/api/menu/{item_id}")
def get_item(item_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM menu_items WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    return dict(row)
 
 
@app.post("/api/menu", status_code=201)
def create_item(item: MenuItem):
    new_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO menu_items (id, name, category, price, description) VALUES (?, ?, ?, ?, ?)",
        (new_id, item.name, item.category, item.price, item.description)
    )
    conn.commit()
    conn.close()
    return {"id": new_id, **item.model_dump()}
 
 
@app.put("/api/menu/{item_id}")
def update_item(item_id: str, item: MenuItem):
    conn = get_db()
    result = conn.execute(
        "UPDATE menu_items SET name=?, category=?, price=?, description=? WHERE id=?",
        (item.name, item.category, item.price, item.description, item_id)
    )
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"id": item_id, **item.model_dump()}
 
 
@app.delete("/api/menu/{item_id}")
def delete_item(item_id: str):
    conn = get_db()
    result = conn.execute("DELETE FROM menu_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"deleted": item_id}
 
 
app.mount("/", StaticFiles(directory="static", html=True), name="static")