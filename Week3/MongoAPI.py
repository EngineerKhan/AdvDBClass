# --- Pydantic models ---
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from motor.motor_asyncio import AsyncIOMotorClient


# --- Settings ---
class Settings(BaseSettings):
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "school"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

# --- DB client & dependency ---
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_url)
    return _client


def get_db():
    return get_client()[settings.mongo_db]


# --- Pydantic models ---
class CourseIn(BaseModel):
    id: str | None = None
    title: str
    credits: int = Field(..., ge=0, le=4)


class CourseOut(BaseModel):
    id: str
    title: str
    credits: int


# --- FastAPI app ---
app = FastAPI(title="FastAPI + Mongo (Minimal)")


@app.get("/")
async def root():
    return {"message": "OK", "db": settings.mongo_db}


@app.get("/courses", response_model=List[CourseOut])
async def list_courses(db=Depends(get_db)):
    docs = await db.courses.find().to_list(100)
    return [CourseOut(id=str(d["_id"]), title=d["title"], credits=d["credits"]) for d in docs]


@app.post("/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
async def create_course(course: CourseIn, db=Depends(get_db)):
    chosen_id = course.id or course.code
    doc = {"title": course.title, "credits": course.credits}
    if chosen_id:
        doc["_id"] = chosen_id
    try:
        result = await db.courses.insert_one(doc)
    except Exception as e:  # DuplicateKeyError etc.
        if "duplicate key" in str(e).lower():
            raise HTTPException(status_code=409, detail="Course already exists")
        raise
    inserted_id = str(chosen_id or result.inserted_id)
    return CourseOut(id=inserted_id, title=course.title, credits=course.credits)


@app.get("/courses/{id}", response_model=CourseOut)
async def get_course(id: str, db=Depends(get_db)):
    d = await db.courses.find_one({"_id": id})
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    return CourseOut(id=str(d["_id"]), title=d["title"], credits=d["credits"])
