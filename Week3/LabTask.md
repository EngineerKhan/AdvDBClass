

# Lab Task 01 — Build a MongoDB‑backed Book API (GoodBooks‑10k)

> **Deadline:** 2021-09-27 23:59:59 UTC.
> 
> This lab task is built purely by chatGPT. 
> In order to keep it unbiased, I didn't use any external resources or edit/modify it one bit. I just chose the dataset and that's it. Everything written below this line is by chatGPT.
> 
> I have reviewed it once, found it both a good learning experience for you plus challenging and hence I am forwarding it as it is, without any modifications. There are things like Docker or MongoDB, which you may find daunting (or may not), but they are useful for so many other courses too, so I have decided to continue with this.
> 
> I have also added some extra points to the rubric, which I think are worth it.
> 
> P.S: You can use chatGPT for help, but only for help. I will take viva to ensure you know what you are doing.
> 
> 
> 
> Talha
---

> **Take‑home, graded**. Individual or pairs (max 2). Designed for **MongoDB + FastAPI** but you may use any web framework in Python. Stick to MongoDB for data storage.

## 1) Goals
- Design and ship a small **production‑style REST API** on top of a real dataset.
- Practice **CSV → MongoDB ingestion**, **schema design**, **indexes**, **query filters**, **pagination**, **validation**, **OpenAPI docs**, **auth**, and **testing**.

## 2) Dataset
Use **GoodBooks‑10k** (10k books, ~6M ratings). We will start with samples to keep dev fast, then your code should scale to the full files.

**Raw sample CSVs (works directly with `pandas` / `mongoimport`):**
- Books: `https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/samples/books.csv`
- Ratings: `https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/samples/ratings.csv`
- Tags map: `https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/samples/tags.csv`
- Book↔Tag links: `https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/samples/book_tags.csv`
- To‑read shelf: `https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/samples/to_read.csv`

> ⚠️ **Tip:** Use **raw.githubusercontent.com** (not `github.com/.../blob/...`). The `blob:` URLs are HTML pages and will break `read_csv`/`mongoimport`.

## 3) Deliverables (what you submit)
1. **GitHub repo** containing:
   - `/app` (API code)
   - `/ingest` (scripts for CSV→MongoDB; idempotent)
   - `/tests` (pytest + HTTP tests)
   - `docker-compose.yml` (MongoDB + API)
   - `README.md` (setup, run, endpoints, assumptions)
   - `openapi.json` (optional export) or `/docs` enabled
2. A **running Dockerized app**: `docker compose up` brings up Mongo + API.
3. **Postman/HTTPie/curl** examples for each endpoint.
4. **Short design note** (1–2 pages): schema, indexes, trade‑offs, limits.

## 4) Required features (MVP)

### 4.1 Data model (MongoDB)
Create these collections (field names suggestive; you may adjust with justification):

- **books**
  ```json
  {
    "book_id": 1234,            // int, from CSV
    "goodreads_book_id": 3735293,
    "title": "Animal Farm",
    "authors": "George Orwell",
    "original_publication_year": 1945,
    "average_rating": 3.98,
    "ratings_count": 273849,
    "image_url": "...",
    "small_image_url": "..."
  }
  ```
- **ratings**
  ```json
  { "user_id": 2001, "book_id": 1234, "rating": 5 }
  ```
- **tags**
  ```json
  { "tag_id": 42, "tag_name": "science-fiction" }
  ```
- **book_tags**
  ```json
  { "goodreads_book_id": 3735293, "tag_id": 42, "count": 17 }
  ```
- **to_read**
  ```json
  { "user_id": 2001, "book_id": 1234 }
  ```

**Indexes (minimum):**
- `books`: `{ title: 1, authors: 1 }` (text or regex‑friendly), `{ average_rating: -1 }`, `{ book_id: 1 }`
- `ratings`: `{ book_id: 1 }`, `{ user_id: 1, book_id: 1 }` (unique)
- `tags`: `{ tag_id: 1 }`, `{ tag_name: 1 }`
- `book_tags`: `{ tag_id: 1 }`, `{ goodreads_book_id: 1 }`
- `to_read`: `{ user_id: 1, book_id: 1 }` (unique)

> Your design note should justify any alternate schema (e.g., embedding popular tags in `books`).

### 4.2 Ingestion
- Write an idempotent script (Python or `mongoimport`) that loads CSVs into MongoDB.
- Skip/UPSERT if documents already exist. Handle types (ints/floats) carefully.
- Allow switching between **samples** and **full** CSVs via env var or CLI flag.

**Examples:**
```bash
# using mongoimport (assumes running Mongo locally or via Docker)
mongoimport --uri "$MONGO_URI" --collection books     --type csv --headerline --file books.csv
mongoimport --uri "$MONGO_URI" --collection ratings   --type csv --headerline --file ratings.csv
mongoimport --uri "$MONGO_URI" --collection tags      --type csv --headerline --file tags.csv
mongoimport --uri "$MONGO_URI" --collection book_tags --type csv --headerline --file book_tags.csv
mongoimport --uri "$MONGO_URI" --collection to_read   --type csv --headerline --file to_read.csv
```

### 4.3 API endpoints
All responses are JSON. Implement proper status codes, parameter validation, and pagination metadata: `{ items, page, page_size, total }`.

- `GET /books`
  - **Query:** `q` (search title/authors), `tag` (tag_name),
    `min_avg` (float), `year_from`, `year_to`,
    `sort` in {`avg`, `ratings_count`, `year`, `title`}, `order` in {`asc`,`desc`},
    `page` (default 1), `page_size` (max 100).
- `GET /books/{book_id}`
- `GET /books/{book_id}/tags` (join via `goodreads_book_id`→`book_tags`→`tags`)
- `GET /authors/{author_name}/books` (case‑insensitive exact or partial)
- `GET /tags` (paginated list; include per‑tag book counts)
- `GET /users/{user_id}/to-read`
- `GET /books/{book_id}/ratings/summary` (avg, count, histogram 1–5)
- `POST /ratings` *(protected)* body: `{ user_id, book_id, rating (1–5) }`
  - Upsert on duplicate `(user_id, book_id)` or return `409`—your choice, but document it.

### 4.4 Cross‑cutting requirements
- **OpenAPI docs** at `/docs` or `/openapi.json` with models + param descriptions.
- **Validation**: Pydantic request/response models (or your framework’s equivalent).
- **Auth**: Simple API key header `x-api-key` required for `POST /ratings`.
- **Logging**: JSONL log per request with `{ route, params, status, latency_ms, client_ip, ts }`.
- **Error shape**: `{ "detail": "..." }` with informative messages.

## 5) Nice‑to‑have (pick any 3+)
- **Recommendations**: `GET /users/{id}/recommendations?top_k=20` (e.g., top‑rated among user’s favorite tags; or naive user‑based CF).
- **Rate limiting**: e.g., 60 req/min per IP → HTTP 429.
- **Caching**: Cache heavy aggregations for 60s.
- **Fuzzy search** on title/author.
- **Bulk ratings**: `POST /ratings:batch`.
- **Metrics**: `/metrics` with request counters + latency histograms.
- **Health**: `/healthz` (Mongo ping, build info).
- **ETag/Last‑Modified** for `GET /books/{id}`.
- **CI**: GitHub Actions for tests + lint.

## 6) Example contracts

### List books
```
GET /books?q=orwell&year_from=1930&year_to=1950&sort=avg&order=desc&page=1&page_size=10
```
**200**
```json
{
  "items": [
    {
      "book_id": 170, "title": "Animal Farm", "authors": "George Orwell",
      "average_rating": 3.98, "ratings_count": 273849, "original_publication_year": 1945
    }
  ],
  "page": 1, "page_size": 10, "total": 3
}
```

### Create/update a rating (protected)
```
POST /ratings
x-api-key: <KEY>
{
  "user_id": 2001, "book_id": 170, "rating": 5
}
```
**201** on insert, **200** on update, or **400/401/409** as applicable.

## 7) FastAPI skeleton (optional starter)
```python
# app/main.py
from fastapi import FastAPI, Query, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from pymongo import MongoClient
import os, math, time

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "goodbooks")
API_KEY = os.getenv("API_KEY", "dev-key")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
app = FastAPI(title="GoodBooks API (MongoDB)")

class RatingIn(BaseModel):
    user_id: int
    book_id: int
    rating: int = Field(ge=1, le=5)

def require_key(req: Request):
    if req.headers.get("x-api-key") != API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.time()
    resp = await call_next(request)
    dt = int((time.time()-t0)*1000)
    print({"route": str(request.url.path), "query": dict(request.query_params),
           "status": resp.status_code, "latency_ms": dt, "ip": request.client.host})
    return resp

@app.get("/books")
def list_books(q: str | None = None, tag: str | None = None,
               min_avg: float | None = None,
               year_from: int | None = None, year_to: int | None = None,
               sort: str = Query("avg", pattern="^(avg|ratings_count|year|title)$"),
               order: str = Query("desc", pattern="^(asc|desc)$"),
               page: int = 1, page_size: int = Query(20, le=100)):
    filt = {}
    if q:
        filt["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"authors": {"$regex": q, "$options": "i"}}
        ]
    if min_avg is not None:
        filt["average_rating"] = {"$gte": float(min_avg)}
    year_clause = {}
    if year_from is not None: year_clause["$gte"] = year_from
    if year_to   is not None: year_clause["$lte"] = year_to
    if year_clause: filt["original_publication_year"] = year_clause
    # optional: tag filter via aggregation join to book_tags/tags (left for students)

    sort_map = {"avg": "average_rating", "ratings_count": "ratings_count",
                "year": "original_publication_year", "title": "title"}
    direction = -1 if order == "desc" else 1

    total = db.books.count_documents(filt)
    items = list(db.books.find(filt)
                 .sort([(sort_map[sort], direction)])
                 .skip((page-1)*page_size)
                 .limit(page_size))
    for x in items: x["_id"] = str(x["_id"])  # make JSON‑serializable
    return {"items": items, "page": page, "page_size": page_size, "total": total}

@app.post("/ratings", dependencies=[Depends(require_key)])
def upsert_rating(r: RatingIn):
    res = db.ratings.update_one({"user_id": r.user_id, "book_id": r.book_id},
                                {"$set": r.model_dump()}, upsert=True)
    return {"upserted": bool(res.upserted_id), "matched": res.matched_count}
```

## 8) Grading rubric (100 pts)
**Functionality (40)**
- Correct ingestion, idempotent (8)
- Core endpoints complete (12)
- Pagination/sorting/filtering (10)
- Protected POST /ratings with validation (10)

**Code quality (20)**
- Clear structure, typing, linting (8)
- Error handling & validation (8)
- Config via env vars; secrets not committed (4)

**Docs & tests (20)**
- OpenAPI complete (8)
- README with setup/run/decisions (4)
- Tests for happy paths & edges (8)

**Operations (20)**
- Dockerized, one‑command run (6)
- Logging (route, params, status, latency, IP) (6)
- 3+ extras from Section 5 (8)

> **Penalties:** -5 to -20 for flaky startup, missing instructions, hard‑coded paths, or non‑reproducible seeds.

## 9) Timeline & submission
- **Release:** Week 3
- **Due:** Start of Week 5 class (hard deadline)
- Submit GitHub repo link + short Loom (≤3 min) showing `/docs` and 3 calls.

## 10) Common pitfalls & quick fixes
- **`pandas.read_csv` fails with GitHub URL** → Use the **raw** URL, not `blob`. Example:
  ```python
  pd.read_csv("https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/samples/books.csv")
  ```
- **`ValueError: Out of range float values are not JSON compliant: nan`** → Clean NaNs before returning:
  ```python
  df = df.fillna("")  # or cast columns explicitly
  ```
- **Pandas boolean chaining error** (e.g., `Cannot perform 'rand_' ...`) → Use parentheses and vectorized comparisons on Series only:
  ```python
  mask = (df["authors"].str.contains("Orwell", case=False, na=False)) & \
         (df["original_publication_year"].between(1940, 1947))
  df[mask]
  ```
- **Uvicorn `Error loading ASGI app. Attribute "app1" not found`** → Ensure you run the correct variable name: `uvicorn example2:app --reload`.

---

### (Optional) mongo shell helpers
```js
// counts per tag (needs book_tags + tags)
db.book_tags.aggregate([
  {$group:{_id:"$tag_id", uses:{$sum:"$count"}}},
  {$sort:{uses:-1}},
  {$limit:20},
  {$lookup:{from:"tags", localField:"_id", foreignField:"tag_id", as:"tag"}},
  {$unwind:"$tag"},
  {$project:{_id:0, tag_id:"$_id", tag_name:"$tag.tag_name", uses:1}}
])
```

**Good luck — ship something you’re proud of!**