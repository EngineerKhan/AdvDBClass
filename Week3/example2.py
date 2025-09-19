from fastapi import *
import pandas as pd

CSV_URL = "https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/refs/heads/master/samples/books.csv"
df = pd.read_csv(CSV_URL)
df = df.where(pd.notnull(df), None)

app = FastAPI()

@app.get("/books/{bookId}")
def return_book(bookId: int):
    return df[df["book_id"]==bookId].to_dict(orient="records")

from fastapi import Query
from typing import Optional

_year = pd.to_numeric(df["original_publication_year"], errors="coerce")
@app.get("/books")

def return_books(
    author: str = Query(..., description="Substring match on author name"),
    language: Optional[str] = Query('eng', description="3-letter code like 'eng'"),
    year1: Optional[int] = Query(1800),
    year2: Optional[int] = Query(2025),
):
    mask_author = df["authors"].str.contains(author, case=False, na=False)
    mask_year = (_year >= year1) & (_year <= year2)

    # (optional) include language if you want it to actually do something
    if language is not None:
        mask_lang = df["language_code"].fillna("").str.lower() == language.lower()
        mask = mask_author & mask_year & mask_lang
    else:
        mask = mask_author & mask_year

    return df[mask].to_dict(orient="records")
