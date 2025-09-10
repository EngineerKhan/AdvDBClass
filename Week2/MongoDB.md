## Basic DDL (Data Definition Language) Comparison

| MongoDB Command                         | SQL Equivalent                    | Notes                                                                                  |
|---------------------------------------|---------------------------------|----------------------------------------------------------------------------------------|
| `use db`                              | `CREATE DATABASE db; USE db;`   | Switch to or create a new database.                                                    |
| `db.createCollection(name, options)` | `CREATE TABLE name (...);`       | Create a new collection/table; options can include capped collections, validation.     |
| Capped collections                    | `CREATE TABLE ... WITH (MAXSIZE)`| Fixed-size collections similar to fixed-size tables or logs.                          |
| Schema validation (`validator` option)| `ALTER TABLE ... ADD CONSTRAINT` | Enforce document schema rules; similar to constraints in SQL tables.                   |
| `db.dropDatabase()`                   | `DROP DATABASE db;`              | Deletes the entire database and all its collections/tables.                           |
| `db.collection.drop()`                | `DROP TABLE table;`              | Deletes a collection/table.                                                           |

### DDL Examples

#### 1) Create Database
**MongoDB**
```javascript
use school
```
**SQL**
```sql
CREATE DATABASE school;
USE school;
```

#### 2) Create Collection/Table
**MongoDB**
```javascript
db.createCollection("students")
```
**SQL**
```sql
CREATE TABLE students (
  _id INT PRIMARY KEY,
  name VARCHAR(100),
  age INT,
  major VARCHAR(50),
  gpa FLOAT
);
```

#### 3) Add Schema Validation / Constraint
**MongoDB**
```javascript
db.createCollection("students", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "gpa"],
      properties: {
        _id: { bsonType: "int" },
        name: { bsonType: "string" },
        gpa: { bsonType: "double", minimum: 0.0, maximum: 4.0 }
      }
    }
  }
})
```
**SQL**
```sql
ALTER TABLE students
  ADD CONSTRAINT gpa_range CHECK (gpa >= 0.0 AND gpa <= 4.0),
  ALTER COLUMN name SET NOT NULL;
```

#### 4) Drop Collection/Table
**MongoDB**
```javascript
db.students.drop()
```
**SQL**
```sql
DROP TABLE students;
```

#### 5) Drop Database
**MongoDB**
```javascript
db.dropDatabase()
```
**SQL**
```sql
DROP DATABASE school;
```

#### 6) Alter / Update Schema
**MongoDB (modify validator with `collMod`)**
```javascript
// Tighten validation: enforce required fields and ranges
use school

db.runCommand({
  collMod: "students",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "gpa"],
      properties: {
        _id: { bsonType: "int" },
        name: { bsonType: "string", minLength: 1 },
        gpa: { bsonType: "double", minimum: 0.0, maximum: 4.0 },
        major: { bsonType: ["string", "null"] }
      }
    }
  },
  validationLevel: "moderate",      // "off" | "moderate" | "strict"
  validationAction: "error"          // "warn" to log but allow writes
})

// Relax validation (example): allow missing gpa during ingestion
db.runCommand({
  collMod: "students",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name"],
      properties: {
        _id: { bsonType: "int" },
        name: { bsonType: "string" },
        gpa: { bsonType: ["double", "null"] }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
})
```

**SQL (alter table constraints / columns)**
```sql
-- Add a new column
ALTER TABLE students ADD COLUMN email VARCHAR(255);

-- Tighten constraints (range + NOT NULL)
ALTER TABLE students
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT gpa_range CHECK (gpa >= 0.0 AND gpa <= 4.0);

-- Change data type (example: float -> numeric with precision)
ALTER TABLE students ALTER COLUMN gpa TYPE NUMERIC(3,2);

-- Drop or replace a constraint
ALTER TABLE students DROP CONSTRAINT gpa_range;
```

## Basic Queries

 --------------------------------------------------------
 MongoDB CRUD Methods vs SQL Counterparts
 --------------------------------------------------------

 | MongoDB Method            | SQL Equivalent                         | Notes                                                  |
 |----------------------------|----------------------------------------|--------------------------------------------------------|
 | `db.collection.insertOne()` | INSERT INTO table VALUES (...)         | Inserts a single document.                             |
 | `db.collection.insertMany()` | INSERT INTO table (...) VALUES (...),(...); | Inserts multiple documents in bulk.               |
 | `db.collection.find()`      | SELECT * FROM table WHERE ...          | Returns a cursor (can chain .limit(), .sort(), etc.).  |
 | `db.collection.findOne()`   | SELECT * FROM table WHERE ... LIMIT 1  | Returns first matching document.                       |
 | `db.collection.updateOne()` | UPDATE table SET ... WHERE ... LIMIT 1 | Updates first matching document.                       |
 | `db.collection.updateMany()` | UPDATE table SET ... WHERE ...         | Updates all matching documents.                        |
 | `db.collection.deleteOne()`  | DELETE FROM table WHERE ... LIMIT 1    | Deletes first matching document.                       |
 | `db.collection.deleteMany()` | DELETE FROM table WHERE ...            | Deletes all matching documents.                        |
 | `db.collection.replaceOne()` | UPDATE table SET ... WHERE ...         | Replaces entire document with a new one.               |
 | `db.collection.aggregate()`  | SELECT ... GROUP BY ... HAVING ...     | Rich transformations: group, sort, join ($lookup), etc.|
 | `db.collection.createIndex()`| CREATE INDEX ON table(col)             | Improves query performance.                            |
 | `cursor.explain()`          | EXPLAIN SELECT ...                     | Shows execution plan, index use, docs examined, etc.   |

### Side-by-Side Examples

#### 1) INSERT
**MongoDB**
```javascript
db.students.insertOne({ _id: 10, name: "Zara", age: 21, major: "CS", gpa: 3.8 });
db.students.insertMany([
  { _id: 11, name: "Ibrahim", age: 22, major: "Physics", gpa: 3.5 },
  { _id: 12, name: "Noor", age: 20, major: "Math", gpa: 3.9 }
]);
```
**SQL**
```sql
INSERT INTO students (_id, name, age, major, gpa) VALUES (10,'Zara',21,'CS',3.8);
INSERT INTO students (_id, name, age, major, gpa) VALUES (11,'Ibrahim',22,'Physics',3.5),(12,'Noor',20,'Math',3.9);
```

#### 2) SELECT / FIND
**MongoDB** (filter + projection + sort + limit)
```javascript
db.students.find(
  { gpa: { $gte: 3.6 }, major: { $in: ["CS", "Math"] } },
  { _id: 0, name: 1, major: 1, gpa: 1 }
).sort({ gpa: -1 }).limit(5);
```
**SQL**
```sql
SELECT name, major, gpa FROM students
WHERE gpa >= 3.6 AND major IN ('CS','Math')
ORDER BY gpa DESC
LIMIT 5;
```

#### 3) SELECT FIRST ROW
**MongoDB**
```javascript
db.students.findOne({ name: "Zara" }, { _id: 0, name: 1, gpa: 1 });
```
**SQL**
```sql
SELECT name, gpa FROM students WHERE name='Zara' LIMIT 1;
```

#### 4) UPDATE (single vs many, `$set` / `$inc` / `$push`)
**MongoDB**
```javascript
db.students.updateOne(
  { name: "Zara" },
  { $set: { major: "Computer Science" }, $inc: { gpa: 0.1 } }
);

db.students.updateMany(
  { major: "Physics" },
  { $inc: { gpa: 0.05 } }
);

// Example of array append
db.students.updateOne(
  { _id: 10 },
  { $push: { awards: { title: "Dean's List", year: 2025 } } }
);
```
**SQL**
```sql
UPDATE students SET major='Computer Science', gpa=gpa+0.1 WHERE name='Zara' LIMIT 1;
UPDATE students SET gpa=gpa+0.05 WHERE major='Physics';
```

#### 5) REPLACE ENTIRE DOCUMENT
**MongoDB**
```javascript
db.students.replaceOne(
  { _id: 10 },
  { _id: 10, name: "Zara", age: 22, major: "CS", gpa: 3.95 } // note: previous fields not listed are dropped
);
```
**SQL**
```sql
UPDATE students SET name='Zara', age=22, major='CS', gpa=3.95 WHERE _id=10;
```

#### 6) DELETE
**MongoDB**
```javascript
db.students.deleteOne({ name: "Ibrahim" });   // first match
db.students.deleteMany({ gpa: { $lt: 2.5 } }); // all matches
```
**SQL**
```sql
DELETE FROM students WHERE name='Ibrahim' LIMIT 1;
DELETE FROM students WHERE gpa < 2.5;
```

#### 7) AGGREGATE (GROUP BY)
**MongoDB**
```javascript
db.students.aggregate([
  { $match: { gpa: { $gte: 3.0 } } },
  { $group: { _id: "$major", avgGPA: { $avg: "$gpa" }, count: { $sum: 1 } } },
  { $sort: { avgGPA: -1 } }
]);
```
**SQL**
```sql
SELECT major AS _id, AVG(gpa) AS avgGPA, COUNT(*) AS count
FROM students
WHERE gpa >= 3.0
GROUP BY major
ORDER BY avgGPA DESC;
```

#### 8) AGGREGATE (LEFT JOIN via `$lookup`)
**MongoDB**
```javascript
db.enrollments.aggregate([
  { $match: { studentName: "Frank" } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
    }
  },
  { $unwind: "$course" },
  { $project: { _id: 0, student: "$studentName", course: "$course.title", credits: "$course.credits" } }
]);
```
**SQL**
```sql
SELECT e.studentName AS student, c.title AS course, c.credits
FROM enrollments e
LEFT JOIN courses c ON e.courseId = c._id
WHERE e.studentName='Frank';
```

#### 9) INDEX + EXPLAIN
**MongoDB**
```javascript
db.students.createIndex({ major: 1, gpa: -1 }); // compound index
printjson(
  db.students.find({ major: "CS", gpa: { $gte: 3.6 } }).explain("executionStats")
);
```
**SQL**
```sql
CREATE INDEX ON students(major, gpa DESC);
EXPLAIN ANALYZE SELECT *
FROM students
WHERE major='CS' AND gpa >= 3.6;
```

#### 10) UPSERT (update or insert if not found)
**MongoDB**
```javascript
db.students.updateOne(
  { _id: 50 },
  { $set: { name: "Aisha", major: "Math", gpa: 3.4 } },
  { upsert: true }
);
```
**SQL (PostgreSQL style)**
```sql
INSERT INTO students (_id, name, major, gpa)
VALUES (50,'Aisha','Math',3.4)
ON CONFLICT (_id) DO UPDATE
SET name='Aisha', major='Math', gpa=3.4;
```

#### 11) TRANSACTIONS (multi-collection, requires replica set)
**MongoDB**
```javascript
const s = db.getMongo().startSession();
s.startTransaction();
try {
  const sch = s.getDatabase("school");
  sch.enrollments.insertOne({ studentName: "Noor", courseId: "CS101", grade: "A" });
  sch.courses.updateOne({ _id: "CS101" }, { $inc: { seatsTaken: 1 } });
  s.commitTransaction();
} catch (e) {
  s.abortTransaction();
  throw e;
}
```
**SQL**
```sql
BEGIN;
INSERT INTO enrollments (studentName, courseId, grade) VALUES ('Noor','CS101','A');
UPDATE courses SET seatsTaken = seatsTaken + 1 WHERE _id='CS101';
COMMIT;
```

 --------------------------------------------------------

 --------------------------------------------------------

## Mongo Aggregation vs SQL: Operator Mapping Cheat Sheet

 --------------------------------------------------------
 (Each row maps a Mongo aggregation concept to a rough SQL counterpart.)

 | MongoDB (Aggregation / Query)     | SQL Counterpart / Analogy                         | Notes / Gotchas                                                                      |
 |-----------------------------------|---------------------------------------------------|--------------------------------------------------------------------------------------|
 | `$match `                           | WHERE                                             | Stage-level filter. Runs early for performance. Can use indexes pre-aggregation.     |
 | `$project`                          | SELECT column list / aliases                      | Controls shape & fields returned. Supports expressions, renames, computed fields.    |
 | `$addFields` / `$set`                 | SELECT with computed columns / CTE columns        | Adds new fields alongside existing ones (does not drop unspecified fields).          |
 | `$unset` / `$project:0`               | SELECT (omit columns)                             | Remove fields from the stream.                                                       |
 | `$group`                            | GROUP BY + aggregates (COUNT, SUM, AVG, MAX, MIN) | Output shape changes to 1 row per “_id”. Non-grouped fields must be aggregated.      |
 | `$sort`                             | ORDER BY                                          | Place after $match to leverage indexes (or before memory limits).                    |
 | `$limit` / `$skip`                    | LIMIT / OFFSET                                    | Use on sorted streams; large offsets can be expensive.                               |
 | `$lookup` (localField/foreignField) | LEFT OUTER JOIN                                   | Basic equality join. Results as array field; use $unwind to flatten.                 |
 | `$lookup` (pipeline + let/`$$vars`)   | LEFT JOIN with complex ON / correlated subquery   | Supports non-equality predicates, projections, sorting, limits inside the join.      |
 | `$unwind`                           | UNNEST / CROSS JOIN LATERAL (explode arrays)      | One input doc → N output docs per array element. Option to keep empties.             |
 | `$expr`                             | WHERE with expressions across fields              | Allows using aggregation expressions in $match; can compare two fields (col-to-col). |
 | `$facet`                            | Multiple subqueries / SELECTs run in parallel     | Fan-out pipelines producing multiple result sets in one pass.                        |
 | `$replaceRoot` / `$replaceWith`       | SELECT * FROM (subquery) / projection reshaping   | Promote a subdocument as the new root document.                                      |
 | `$count`                            | SELECT COUNT(*)                                   | As a stage producing a single document with “count”.                                 |
 | `$out` / `$merge`                     | CREATE TABLE AS SELECT / MERGE                    | Materialize pipeline results into a collection; $merge supports upsert strategies.   |
 | `$setWindowFields`                  | SQL window functions (OVER/PARTITION BY/ORDER BY) | Moving averages, ranks, lag/lead. Requires indexes for large partitions.             |
 | `$in` / `$nin`                        | IN / NOT IN                                       | Membership tests; with indexes can be efficient on $match.                           |
 | `$regex`                            | LIKE / REGEXP                                     | Beware of non-anchored patterns for performance.                                     |
 | `$sample`                           | TABLESAMPLE / ORDER BY RAND() LIMIT k             | Random sampling; uses reservoir sampling internally.                                 |
 | `coll.find({...}, {a:1})`           | SELECT a FROM table WHERE ...                     | Simple find with projection; no pipeline needed.                                     |
 | `coll.createIndex({f:1})`           | CREATE INDEX ON table(f)                          | Critical for $match/$lookup performance.                                             |
 | `.explain("executionStats")`        | EXPLAIN / EXPLAIN ANALYZE                         | Inspect winning plan, index usage, doc examination counts.                           |

 --------------------------------------------------------
 ## Explanations & Usage Notes

 --------------------------------------------------------

 ### `$unwind` (explode arrays):
 - Purpose: Turns each element of an array field into its own document row (like SQL UNNEST).
 - Syntax:
```js
     { $unwind: { path: "$courses", preserveNullAndEmptyArrays: true } }
```
 - When to use: After $lookup (to convert the joined array into rows) or when arrays must be filtered/sorted independently.
 - Gotchas: Increases row count; consider placing $match after $unwind to reduce volume quickly.

 ### `$expr` (expressions inside $match):
 - Purpose: Use aggregation expressions and compare two fields within the same document (e.g., col-to-col comparisons).
 - Syntax examples:
```js
     { $match: { $expr: { $gt: [ "$revenue", "$cost" ] } } }
     { $match: { $expr: { $eq: [ "$studentId", "$$sid" ] } } }    with $lookup.pipeline let: { sid: "$_id" }
```
 - Analogy: SQL WHERE with expressions between columns (e.g., WHERE revenue > cost). Enables correlated subqueries/joins.

 ### `$lookup` (basic vs pipeline):
 - Basic equality join:
     `{ $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } }`
 - With pipeline (more power):
```js
{ $lookup: {
         from: "courses",
         let: { cid: "$courseId" },
         pipeline: [
           { $match: { $expr: { $and: [ { $eq: [ "$_id", "$$cid" ] }, { $gte: [ "$credits", 3 ] } ] } } },
           { $project: { _id: 0, code: "$_id", title: 1, credits: 1 } }
         ],
         as: "course"
     } }
```

 - Analogy: LEFT JOIN with complex ON conditions or a correlated subquery + SELECT list trimming inside the join.
 - Tip: Follow with $unwind "$course" to get one row per match (or preserve arrays if 1:N is intended).

 ### `$project` vs `$addFields`/`$set`:
 - $project specifies the output columns (include/exclude + computed expressions).
 - $addFields/$set adds columns but keeps the rest intact; think “SELECT *, new_col AS …”.
 - Use $project near the end to deliver a clean SELECT list; use $addFields mid-pipeline for intermediate calculations.

 ### `$group`:
 - Works like GROUP BY; “_id” is your grouping key (can be an object for multi-key groupings).
 - Non-grouped fields must be aggregated (e.g., $sum, $avg, $first, $push).
 - Tip: For top-N per group, combine $setWindowFields (rank) or $group + $sort + $limit within $facet.

 ## Performance Considerations

 - Put `$match` as early as possible; it can be index-assisted if it runs before $project/$group that change fields.
 - For `$lookup`, ensure an index on the foreign collection’s join key (e.g., courses: { _id: 1 }) and often on the local key too.
 - Prefer `$lookup` with pipeline when you can filter/project inside the join to reduce transfer volume.
 - Use `.explain("executionStats")` to confirm IXSCAN vs COLLSCAN and docExamined counts.
 - Beware large `$unwind` results—filter early, or use $slice/$filter in $project before $unwind.

## CRUD Summary Table (Mongo vs SQL)

| MongoDB Method            | SQL Equivalent                         | Notes                                                  |
|--------------------------|----------------------------------------|--------------------------------------------------------|
| `insertOne()`            | INSERT INTO table VALUES (...)         | Insert a single record/document.                        |
| `insertMany()`           | INSERT INTO table (...) VALUES (...),(...); | Bulk insert multiple records.                          |
| `updateOne()`            | UPDATE table SET ... WHERE ... LIMIT 1 | Update first matching record.                           |
| `updateMany()`           | UPDATE table SET ... WHERE ...          | Update all matching records.                            |
| `deleteOne()`            | DELETE FROM table WHERE ... LIMIT 1    | Delete first matching record.                           |
| `deleteMany()`           | DELETE FROM table WHERE ...             | Delete all matching records.                            |
| `find()`                 | SELECT * FROM table WHERE ...           | Retrieve multiple records; supports chaining (sort, limit). |
| `findOne()`              | SELECT * FROM table WHERE ... LIMIT 1  | Retrieve first matching record.                         |

## Quick Lab Tasks (Try It Yourself)

1. Insert a new student document with your own details into the `students` collection.
2. Update the GPA of a specific student by increasing it by 0.2.
3. Perform a join between `enrollments` and `courses` collections to list all courses a student is enrolled in.
4. Create an index on the `major` and `gpa` fields, then run an explain plan on a query filtering by these fields to observe index usage.