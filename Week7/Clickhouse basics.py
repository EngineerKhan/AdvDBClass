

"""
ClickHouse Interactive Tutorial: Connections, Tables, Joins, and UUIDs
Run each section step by step in PyCharm or a Jupyter environment.
"""

from clickhouse_connect import get_client
import pandas as pd

# ============================================
# 1. Connect to ClickHouse
# ============================================
# Make sure the ClickHouse server is running locally (default port 8123)
client = get_client(host='localhost', username='default', password='')

print("✅ Connected to ClickHouse server successfully!")
print(client.query('SELECT version()').result_rows)

# ============================================
# 2. Create a new database
# ============================================
client.command("CREATE DATABASE IF NOT EXISTS university_demo")
client.command("USE university_demo")
print("📦 Database 'university_demo' created and selected.")

# ============================================
# 3. Create tables
# ============================================

# Students table with UUID
client.command("""
CREATE TABLE IF NOT EXISTS university_demo.students (
    student_id UUID DEFAULT generateUUIDv4(),
    name String,
    age UInt8,
    country String
) ENGINE = MergeTree()
ORDER BY (name);
""")

# Courses table
client.command("""
CREATE TABLE IF NOT EXISTS university_demo.courses (
    course_id UUID DEFAULT generateUUIDv4(),
    title String,
    department String
) ENGINE = MergeTree()
ORDER BY (department, title);
""")

# Enrollments table (joins students to courses)
client.command("""
CREATE TABLE IF NOT EXISTS university_demo.enrollments (
    enroll_id UUID DEFAULT generateUUIDv4(),
    student_id UUID,
    course_id UUID,
    grade Float32
) ENGINE = MergeTree()
ORDER BY (student_id, course_id);
""")

print("✅ Created tables: students, courses, enrollments.")

# ============================================
# 4. Insert data
# ============================================

# Insert students
students = [
    ("Alice", 22, "UK"),
    ("Bob", 24, "USA"),
    ("Carlos", 23, "Spain"),
    ("Diana", 21, "Germany"),
]
client.insert("university_demo.students", students, column_names=["name", "age", "country"])
print("👩‍🎓 Inserted student data.")

# Insert courses
courses = [
    ("Databases", "Computer Science"),
    ("Machine Learning", "Computer Science"),
    ("Econometrics", "Economics"),
    ("Marketing", "Business"),
]
client.insert("university_demo.courses", courses, column_names=["title", "department"])
print("📚 Inserted course data.")

# Fetch the generated UUIDs for joining
students_df = client.query_df("SELECT * FROM university_demo.students")
courses_df = client.query_df("SELECT * FROM university_demo.courses")

print("🎓 Students Table:")
print(students_df)
print("📘 Courses Table:")
print(courses_df)

# Map some enrollments
enrollments = [
    (students_df.loc[0, "student_id"], courses_df.loc[0, "course_id"], 95.0),
    (students_df.loc[1, "student_id"], courses_df.loc[1, "course_id"], 88.0),
    (students_df.loc[2, "student_id"], courses_df.loc[0, "course_id"], 92.5),
    (students_df.loc[3, "student_id"], courses_df.loc[2, "course_id"], 76.5),
]
client.insert("university_demo.enrollments", enrollments, column_names=["student_id", "course_id", "grade"])
print("🧾 Inserted enrollments data.")

# ============================================
# 5. Query examples
# ============================================

# Select all students
print("\n👀 All Students:")
print(client.query_df("SELECT name, age, country FROM university_demo.students"))

# Simple join between students and enrollments
print("\n🔗 Join Example (Students + Enrollments):")
join_df = client.query_df("""
SELECT s.name, s.country, c.title, e.grade
FROM university_demo.enrollments e
JOIN university_demo.students s ON e.student_id = s.student_id
JOIN university_demo.courses c ON e.course_id = c.course_id
ORDER BY s.name
""")
print(join_df)

# Aggregation: Average grade by country
print("\n📊 Average Grade by Country:")
avg_grade_df = client.query_df("""
SELECT s.country, avg(e.grade) AS avg_grade
FROM university_demo.enrollments e
JOIN university_demo.students s ON e.student_id = s.student_id
GROUP BY s.country
ORDER BY avg_grade DESC
""")
print(avg_grade_df)

# ============================================
# 6. UUID Example
# ============================================
print("\n🆔 Example of UUID usage:")
uuid_example = client.query_df("SELECT generateUUIDv4() AS new_uuid")
print(uuid_example)

# ============================================
# 7. Clean up (optional)
# ============================================
# Uncomment if you want to remove all demo tables
# client.command("DROP DATABASE IF EXISTS university_demo")
# print("🧹 Cleaned up demo database.")