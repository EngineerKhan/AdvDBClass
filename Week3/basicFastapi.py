import string

from fastapi import *
import pandas as pd
from typing import Dict, Optional
#Installation: pip install fastapi uvicorn[standard]

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "In the Name of Allah"}

@app.get("/photos")
def dummyphotos():
    return {"message": "Here are some photos"}


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    return {"Dummy API call for": item_id}

####

@app.get("/students/{id}")
def get_student(id: int) -> Dict:
    df = pd.read_csv("students.csv")
    student_row = df[(df["id"] == id)].iloc[0]

    return student_row.to_dict()

@app.get("/students")
def get_student(
        major: str = Query(...),
        city: Optional[str] = Query(None),
        age: Optional[int] = Query(None, ge=18, le=100)) \
        -> Dict:
    df = pd.read_csv("students.csv")
    filtered_df = df[df["major"] == major]

    if city:
        filtered_df = filtered_df[filtered_df["city"] == city]

    if city and age:
        filtered_df = filtered_df[(filtered_df["city"] == city) & (filtered_df["age"] == age)]


    return filtered_df.to_dict()


###
from pydantic import BaseModel, Field

class Student(BaseModel):
    id: int
    name: str = "Unknown"
    age: int = Field(..., ge=18, le=100)
    major: str = "Undeclared"
    city: str = "Unknown"

@app.post("/students")
def create_student(student: Student):
    df = pd.read_csv("students.csv")

    newEntry = {
        "id": student.id,
        "name": student.name,
        "age": student.age,
        "major": student.major,
        "city": student.city,
    }
    df = pd.concat([df, pd.DataFrame([newEntry])], ignore_index=True)
    df.to_csv("students.csv", index=False)

    return {"message": "Student created successfully", "student": student.model_dump()}
