// Switch/Create database

use school;

// Create collection
db.createCollection("students");
db.createCollection("courses");

//Add some data

db.students.insertMany([
  { _id: 1, name: "Alice", age: 21, major: "Computer Science", gpa: 3.7 },
  { _id: 2, name: "Bob", age: 22, major: "Mathematics", gpa: 3.4 },
  { _id: 3, name: "Charlie", age: 20, major: "Physics", gpa: 3.9 }
]);

db.courses.insertMany([
  { _id: "CS101", title: "Intro to Programming", credits: 3 },
  { _id: "MATH201", title: "Linear Algebra", credits: 4 }
]);

//We can also use the normal SQL statements to query the data
SELECT * FROM students;

//Or use where clauses
SELECT * FROM students WHERE age > 21;

//Or use joins
SELECT students.name, courses.title FROM students JOIN courses ON students.major = courses.title;

//We have a much better way to query the data in MongoDB using the aggregation framework, like:
// Find all
db.students.find();

// Filter
db.students.find({ major: "Computer Science" });

// Projection
db.students.find({}, { name: 1, gpa: 1 });

// Comparison operators
db.students.find({ gpa: { $gt: 3.5 } });

// Logical operators
db.students.find({ $or: [ {major: "Physics"}, {gpa: {$gte: 3.8}} ] });

//Now some updates
// Update one
db.students.updateOne(
  { name: "Bob" },
  { $set: { gpa: 3.6 } }
);

// Update many
db.students.updateMany(
  { major: "Computer Science" },
  { $inc: { gpa: 0.1 } }
);

//And some deletes
// Delete one
db.students.deleteOne({ name: "Charlie" });

// Delete many
db.students.deleteMany({ gpa: { $lt: 3.0 } });

//Now some indexes
db.students.createIndex({ name: 1 });
db.students.createIndex({ gpa: -1 });
db.students.getIndexes();

//And some aggregations
// Count students by major
// Average GPA by major
db.students.aggregate([
  { $group: { _id: "$major", avgGPA: { $avg: "$gpa" } } }
]);

// Students with GPA >= 3.5, sorted
db.students.aggregate([
  { $match: { gpa: { $gte: 3.5 } } },
  { $sort: { gpa: -1 } }
]);

// Reference example
db.enrollments.insertOne({
  studentId: 1,
  courseId: "CS101",
  semester: "Fall 2025"
});

// Embedded example
db.students.insertOne({
  name: "Diana",
  major: "Biology",
  courses: [
    { courseId: "BIO110", grade: "A" },
    { courseId: "CHEM101", grade: "B+" }
  ]
});

session = db.getMongo().startSession();
session.startTransaction();

try {
  session.getDatabase("school").students.updateOne(
    { _id: 1 }, { $inc: { gpa: -0.2 } }
  );
  session.getDatabase("school").courses.updateOne(
    { _id: "CS101" }, { $inc: { credits: 1 } }
  );
  session.commitTransaction();
} catch (e) {
  session.abortTransaction();
}

// --------------------------------------------------------
// Hands-on Exercise: Embedding vs Referencing
// --------------------------------------------------------

// 1. EMBEDDING APPROACH
// Each student document contains an array of course subdocuments
// Example: Insert a student with embedded courses
db.students.insertOne({
  name: "Eve",
  age: 23,
  major: "Mathematics",
  courses: [
    { courseId: "MATH201", title: "Linear Algebra", grade: "A" },
    { courseId: "CS101", title: "Intro to Programming", grade: "B+" }
  ]
});

// Query: Retrieve Eve's courses (all info is in one document)
db.students.find(
  { name: "Eve" },
  { name: 1, courses: 1 }
);

// Update: Change the grade for "CS101"
db.students.updateOne(
  { name: "Eve", "courses.courseId": "CS101" },
  { $set: { "courses.$.grade": "A-" } }
);

// 2. REFERENCING APPROACH
// Store student and course info separately, and link with an enrollment collection
db.students.insertOne({
  name: "Frank",
  age: 24,
  major: "Physics"
});

db.courses.insertOne({
  _id: "PHYS200",
  title: "Classical Mechanics",
  credits: 4
});

// Link Frank to PHYS200 with an enrollment document
db.enrollments.insertOne({
  studentName: "Frank",
  courseId: "PHYS200",
  grade: "B"
});

// Query: Find Frank's courses (requires a join/lookup)
db.enrollments.aggregate([
  { $match: { studentName: "Frank" } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "courseDetails"
    }
  },
  { $unwind: "$courseDetails" },
  { $project: { studentName: 1, grade: 1, "courseDetails.title": 1 } }
]);

// Update: Change Frank's grade in PHYS200
db.enrollments.updateOne(
  { studentName: "Frank", courseId: "PHYS200" },
  { $set: { grade: "A" } }
);

// --------------------------------------------------------
// Comparison Queries: Retrieval Speed & Structure
// --------------------------------------------------------

// Embedding: Get all of Eve's courses (single read)
db.students.find({ name: "Eve" }, { courses: 1 });

// Referencing: Get all of Frank's courses (requires $lookup)
db.enrollments.aggregate([
  { $match: { studentName: "Frank" } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "courseDetails"
    }
  }
]);

// --------------------------------------------------------
// Update Scenario: Changing Course Title
// --------------------------------------------------------

// Embedding: Update course title for all students who took "CS101"
db.students.updateMany(
  { "courses.courseId": "CS101" },
  { $set: { "courses.$.title": "Introduction to Programming" } }
);
// (This might miss students if courses are embedded and the title changes in the 'courses' collection only.)

// Referencing: Update course title in 'courses', and all links are automatically up-to-date
db.courses.updateOne(
  { _id: "CS101" },
  { $set: { title: "Introduction to Programming" } }
);

// --------------------------------------------------------
// Discussion:
// - Embedding is faster for reading all related data together, but harder to update shared data.
// - Referencing is more flexible for shared data and updates, but requires joins for reads.
// Try both approaches and compare!

// --------------------------------------------------------
// Referential Integrity Exercise (+ Selective Fields in Joins)
// --------------------------------------------------------

// 3. BROKEN REFERENCE DEMO (what happens without FK constraints)
// Insert an enrollment that points to a non-existent courseId
db.enrollments.insertOne({
  studentName: "Grace",
  courseId: "MISSING101", // does NOT exist in courses
  grade: "C"
});

// Detect orphaned enrollments (no matching course):
// Strategy A: $lookup -> $unwind (preserve nulls) -> match nulls
db.enrollments.aggregate([
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "courseDetails"
    }
  },
  { $unwind: { path: "$courseDetails", preserveNullAndEmptyArrays: true } },
  { $match: { courseDetails: null } },
  { $project: {
      _id: 0,
      studentName: 1,
      courseId: 1,
      grade: 1,
      note: { $literal: "BROKEN_REFERENCE" }
    }
  }
]);

// Strategy B: $lookup -> $match with $expr & $size == 0 (no unwind)
db.enrollments.aggregate([
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "courseDetails"
    }
  },
  { $match: { $expr: { $eq: [ { $size: "$courseDetails" }, 0 ] } } },
  { $project: { _id: 0, studentName: 1, courseId: 1, grade: 1 } }
]);

// Cleanup suggestion (optional):
// Delete orphaned enrollments after review (BE CAREFUL!)
// db.enrollments.deleteMany({ courseId: { $nin: db.courses.distinct("_id") } });


// --------------------------------------------------------
// 4. "JOIN" WITH SELECTIVE FIELDS (SQL-style SELECT list)
// --------------------------------------------------------

// Option A: Simple $lookup then $project the exact fields you want
db.enrollments.aggregate([
  { $match: { studentName: "Frank" } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "courseDetails"
    }
  },
  { $unwind: "$courseDetails" },
  { $project: {
      _id: 0,
      student: "$studentName",
      courseCode: "$courseDetails._id",
      title: "$courseDetails.title",
      credits: "$courseDetails.credits",
      grade: 1
    }
  }
]);

// Option B: $lookup with a pipeline to LIMIT fields upstream and even RENAME
db.enrollments.aggregate([
  { $match: { studentName: "Frank" } },
  { $lookup: {
      from: "courses",
      let: { cid: "$courseId" },
      pipeline: [
        { $match: { $expr: { $eq: [ "$_id", "$$cid" ] } } },
        { $project: { _id: 0, code: "$_id", title: 1, credits: 1 } } // SELECT code,title,credits
      ],
      as: "course"
    }
  },
  { $unwind: "$course" },
  { $project: {
      _id: 0,
      student: "$studentName",
      courseCode: "$course.code",
      title: "$course.title",
      credits: "$course.credits",
      grade: 1
    }
  }
]);

// Notes:
// - Use $project anywhere after $lookup to "SELECT" only specific fields.
// - Use $lookup.pipeline + $project to trim & rename fields before they join.
// - For performance, consider indexes: courses: { _id: 1 }, enrollments: { courseId: 1, studentName: 1 }.

// --------------------------------------------------------
// Mongo Aggregation vs SQL: Operator Mapping Cheat Sheet
// --------------------------------------------------------
// (This is a commented table. Each row maps a Mongo aggregation concept to a rough SQL counterpart.)
//
// | MongoDB (Aggregation / Query)    | SQL Counterpart / Analogy                                  | Notes / Gotchas                                                                                |
// |----------------------------------|-------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
// | $match                           | WHERE                                                       | Stage-level filter. Runs early for performance. Can use indexes pre-aggregation.               |
// | $project                         | SELECT column list / aliases                                | Controls shape & fields returned. Supports expressions, renames, computed fields.             |
// | $addFields / $set                | SELECT with computed columns / CTE columns                  | Adds new fields alongside existing ones (does not drop unspecified fields).                   |
// | $unset / $project:0              | SELECT (omit columns)                                       | Remove fields from the stream.                                                                 |
// | $group                           | GROUP BY + aggregates (COUNT, SUM, AVG, MAX, MIN)           | Output shape changes to 1 row per “_id”. Non-grouped fields must be aggregated.               |
// | $sort                            | ORDER BY                                                    | Place after $match to leverage indexes (or before memory limits).                              |
// | $limit / $skip                   | LIMIT / OFFSET                                              | Use on sorted streams; large offsets can be expensive.                                         |
// | $lookup (localField/foreignField)| LEFT OUTER JOIN                                             | Basic equality join. Results as array field; use $unwind to flatten.                           |
// | $lookup (pipeline + let/$$vars)  | LEFT JOIN with complex ON / correlated subquery             | Supports non-equality predicates, projections, sorting, limits inside the join.                |
// | $unwind                          | UNNEST / CROSS JOIN LATERAL (explode arrays)               | One input doc → N output docs per array element. Option to keep empties.                      |
// | $expr                            | WHERE with expressions across fields                        | Allows using aggregation expressions in $match; can compare two fields (col-to-col).          |
// | $facet                           | Multiple subqueries / SELECTs run in parallel               | Fan-out pipelines producing multiple result sets in one pass.                                  |
// | $replaceRoot / $replaceWith      | SELECT * FROM (subquery) / projection reshaping             | Promote a subdocument as the new root document.                                                |
// | $count                           | SELECT COUNT(*)                                             | As a stage producing a single document with “count”.                                           |
// | $out / $merge                    | CREATE TABLE AS SELECT / MERGE                              | Materialize pipeline results into a collection; $merge supports upsert strategies.            |
// | $setWindowFields                 | SQL window functions (OVER/PARTITION BY/ORDER BY)           | Moving averages, ranks, lag/lead. Requires indexes for large partitions.                      |
// | $in / $nin                       | IN / NOT IN                                                 | Membership tests; with indexes can be efficient on $match.                                     |
// | $regex                           | LIKE / REGEXP                                               | Beware of non-anchored patterns for performance.                                               |
// | $sample                          | TABLESAMPLE / ORDER BY RAND() LIMIT k                       | Random sampling; uses reservoir sampling internally.                                           |
// | coll.find({...}, {a:1})          | SELECT a FROM table WHERE ...                               | Simple find with projection; no pipeline needed.                                               |
// | coll.createIndex({f:1})          | CREATE INDEX ON table(f)                                    | Critical for $match/$lookup performance.                                                       |
// | .explain("executionStats")       | EXPLAIN / EXPLAIN ANALYZE                                   | Inspect winning plan, index usage, doc examination counts.                                     //
//
// --------------------------------------------------------
// Explanations & Usage Notes
// --------------------------------------------------------
//
// $unwind (explode arrays):
// - Purpose: Turns each element of an array field into its own document row (like SQL UNNEST).
// - Syntax:
//     { $unwind: { path: "$courses", preserveNullAndEmptyArrays: true } }
// - When to use: After $lookup (to convert the joined array into rows) or when arrays must be filtered/sorted independently.
// - Gotchas: Increases row count; consider placing $match after $unwind to reduce volume quickly.
//
// $expr (expressions inside $match):
// - Purpose: Use aggregation expressions and compare two fields within the same document (e.g., col-to-col comparisons).
// - Syntax examples:
//     { $match: { $expr: { $gt: [ "$revenue", "$cost" ] } } }
//     { $match: { $expr: { $eq: [ "$studentId", "$$sid" ] } } }   // with $lookup.pipeline let: { sid: "$_id" }
// - Analogy: SQL WHERE with expressions between columns (e.g., WHERE revenue > cost). Enables correlated subqueries/joins.
//
// $lookup (basic vs pipeline):
// - Basic equality join:
//     { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } }
// - With pipeline (more power):
//     { $lookup: {
//         from: "courses",
//         let: { cid: "$courseId" },
//         pipeline: [
//           { $match: { $expr: { $and: [ { $eq: [ "$_id", "$$cid" ] }, { $gte: [ "$credits", 3 ] } ] } } },
//           { $project: { _id: 0, code: "$_id", title: 1, credits: 1 } }
//         ],
//         as: "course"
//     } }
// - Analogy: LEFT JOIN with complex ON conditions or a correlated subquery + SELECT list trimming inside the join.
// - Tip: Follow with $unwind "$course" to get one row per match (or preserve arrays if 1:N is intended).
//
// $project vs $addFields/$set:
// - $project specifies the output columns (include/exclude + computed expressions).
// - $addFields/$set adds columns but keeps the rest intact; think “SELECT *, new_col AS …”.
// - Use $project near the end to deliver a clean SELECT list; use $addFields mid-pipeline for intermediate calculations.
//
// $group:
// - Works like GROUP BY; “_id” is your grouping key (can be an object for multi-key groupings).
// - Non-grouped fields must be aggregated (e.g., $sum, $avg, $first, $push).
// - Tip: For top-N per group, combine $setWindowFields (rank) or $group + $sort + $limit within $facet.
//
// Performance Considerations:
// - Put $match as early as possible; it can be index-assisted if it runs before $project/$group that change fields.
// - For $lookup, ensure an index on the foreign collection’s join key (e.g., courses: { _id: 1 }) and often on the local key too.
// - Prefer $lookup with pipeline when you can filter/project inside the join to reduce transfer volume.
// - Use .explain("executionStats") to confirm IXSCAN vs COLLSCAN and docExamined counts.
// - Beware large $unwind results—filter early, or use $slice/$filter in $project before $unwind.
//
// Mini Examples (tied to your lab data):
//
// 1) UNNEST courses for embedded model (SQL: CROSS JOIN LATERAL):
// db.students.aggregate([
//   { $match: { name: "Eve" } },
//   { $unwind: "$courses" },
//   { $project: { _id: 0, student: "$name", courseId: "$courses.courseId", grade: "$courses.grade" } }
// ]);
//
// 2) JOIN enrollments→courses with selective fields (SQL: LEFT JOIN … SELECT list):
// db.enrollments.aggregate([
//   { $match: { studentName: "Frank" } },
//   { $lookup: {
//       from: "courses",
//       let: { cid: "$courseId" },
//       pipeline: [
//         { $match: { $expr: { $eq: [ "$_id", "$$cid" ] } } },
//         { $project: { _id: 0, code: "$_id", title: 1, credits: 1 } }
//       ],
//       as: "course"
//     }
//   },
//   { $unwind: "$course" },
//   { $project: { _id: 0, student: "$studentName", courseCode: "$course.code", title: "$course.title", credits: "$course.credits", grade: 1 } }
// ]);
//
// 3) Correlated filter using $expr (SQL: WHERE t1.col > t2.col or col-to-col):
// db.enrollments.aggregate([
//   { $match: { grade: { $in: ["A", "A-"] } } },
//   { $lookup: {
//       from: "courses",
//       localField: "courseId",
//       foreignField: "_id",
//       as: "course"
//     }
//   },
//   { $unwind: "$course" },
//   { $match: { $expr: { $gte: [ "$course.credits", 3 ] } } },
//   { $project: { _id: 0, student: "$studentName", course: "$course.title", credits: "$course.credits", grade: 1 } }
// ]);

// --------------------------------------------------------
// Performance Harness: .explain("executionStats") + Index Effects
// --------------------------------------------------------
// Goal: let students measure query plans, index usage, docsExamined, and time.
// Run each block once without the suggested index, then create the index and run again.

// 1) Simple find with projection (covered query demo)
// Step A: ensure a clean slate
// db.students.dropIndexes();

// Query plan BEFORE index
// Expect COLLSCAN, higher docsExamined
// Note: executionTimeMillis will vary by machine; focus on plan + scans
var planBefore = db.students.find({ major: "Computer Science" }, { _id: 0, name: 1, gpa: 1 }).explain("executionStats");
printjson(planBefore.executionStats);

// Create a supporting index on the filter and an index-only (covered) projection
// Covered query happens when all projected fields are in the index keys (or in _id if included)
db.students.createIndex({ major: 1, name: 1, gpa: 1 });

// Query plan AFTER index
var planAfter = db.students.find({ major: "Computer Science" }, { _id: 0, name: 1, gpa: 1 }).explain("executionStats");
printjson(planAfter.executionStats);
// Compare: winningPlan.inputStage.stage (IXSCAN vs COLLSCAN),
//          totalDocsExamined, totalKeysExamined, executionTimeMillis


// 2) Aggregation with $match early vs late
// Dataset: students with gpa and major
// A) $match EARLY (preferred)
var early = db.students.aggregate([
  { $match: { gpa: { $gte: 3.5 }, major: { $in: ["Computer Science", "Physics"] } } },
  { $sort: { gpa: -1 } },
  { $project: { _id: 0, name: 1, major: 1, gpa: 1 } }
], { explain: true });
printjson(early);

// B) $match LATE (for contrast)
var late = db.students.aggregate([
  { $project: { _id: 0, name: 1, major: 1, gpa: 1 } },
  { $sort: { gpa: -1 } },
  { $match: { gpa: { $gte: 3.5 }, major: { $in: ["Computer Science", "Physics"] } } }
], { explain: true });
printjson(late);
// Compare stages order and estimated/actual docs read.
// Then create an index to assist the early $match:
db.students.createIndex({ gpa: -1, major: 1 });


// 3) $lookup performance: ensure indexes on join keys
// Foreign (right) side index: courses._id already indexed by default
// Local (left) side helpful index: enrollments.courseId
// Drop and recreate to make students observe changes
// db.enrollments.dropIndexes();
var beforeLookup = db.enrollments.aggregate([
  { $match: { studentName: { $in: ["Frank", "Grace"] } } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
    }
  },
  { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
  { $project: { _id: 0, student: "$studentName", course: "$course.title", credits: "$course.credits", courseId: 1 } }
], { explain: true });
printjson(beforeLookup);

// Create index on local join key
db.enrollments.createIndex({ courseId: 1, studentName: 1 });

var afterLookup = db.enrollments.aggregate([
  { $match: { studentName: { $in: ["Frank", "Grace"] } } },
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
    }
  },
  { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
  { $project: { _id: 0, student: "$studentName", course: "$course.title", credits: "$course.credits", courseId: 1 } }
], { explain: true });
printjson(afterLookup);
// Compare: subplans show IXSCAN on enrollments.courseId when indexed.


// 4) Orphan detection plan (with/without index)
// Create index on enrollments.courseId to speed the $lookup and on courses._id (default)
// Then run the orphan detection pipeline with explain
var orphanPlan = db.enrollments.aggregate([
  { $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "courseDetails"
    }
  },
  { $match: { $expr: { $eq: [ { $size: "$courseDetails" }, 0 ] } } },
  { $project: { _id: 0, studentName: 1, courseId: 1 } }
], { explain: true });
printjson(orphanPlan);


// 5) Hints & covered queries (advanced)
// Example: Force index usage to compare alternatives
// Ensure two indexes exist
// db.students.createIndex({ name: 1 });
// db.students.createIndex({ gpa: -1 });
var hinted = db.students.find({ name: { $regex: /^A/ } }, { _id: 0, name: 1 }).hint({ name: 1 }).explain("executionStats");
printjson(hinted.executionStats);

// Covered query demo (project only indexed fields). If _id is excluded and all projected fields are in the index,
// the plan may avoid fetching full documents (PROJECTION_COVERED):
var covered = db.students.find({ major: "Computer Science" }, { _id: 0, major: 1, name: 1 }).hint({ major: 1, name: 1 }).explain("executionStats");
printjson(covered.executionStats);

// --------------------------------------------------------
// Instructor Notes
// --------------------------------------------------------
// - Ask students to record: winningPlan.stage tree, totalKeysExamined, totalDocsExamined, executionTimeMillis.
// - Have them screenshot BEFORE vs AFTER index for the same query.
// - Discuss why $match early + selective $project reduce work.
// - Emphasize creating indexes on join keys for $lookup (local & foreign sides).
// - Encourage trying different data volumes (insertMany) to amplify differences.

// --------------------------------------------------------
// One‑Page Lab Worksheet (Hand‑In)
// Topic: Embedding vs Referencing, Joins ($lookup), and Performance
// --------------------------------------------------------
// INSTRUCTIONS: Duplicate this block into a separate notes file OR keep here.
// Fill answers inline below each question (as comments). Submit screenshots
// of relevant outputs (plans, metrics) + your written answers.
// --------------------------------------------------------
// PART A — Data Modeling (Embedding vs Referencing)
// A1) In your own words, when is EMBEDDING preferable? Give 2 concrete examples from apps you use.
// Answer:
//   -
//   -
// A2) When is REFERENCING preferable? Give 2 concrete examples and explain why.
// Answer:
//   -
//   -
// A3) For our school dataset, which fields would you embed vs reference if enrollments can exceed 1M rows? Why?
// Answer:
//   -
// --------------------------------------------------------
// PART B — Referential Integrity
// Run the orphan‑detection pipelines from the "Referential Integrity Exercise".
// B1) Paste 1–2 orphan documents you found (if any). If none, explain how you ensured integrity.
// Answer:
//   -
// B2) Propose an application‑level guard (pseudocode) to prevent future orphans.
// Answer:
//   -
// B3) (Optional) Write a safe cleanup strategy for existing orphans. What risks remain?
// Answer:
//   -
// --------------------------------------------------------
// PART C — SQL‑style SELECT List with $lookup
// Use the pipelines under "JOIN with Selective Fields".
// C1) Modify the pipeline to return: student, courseCode, title, credits, grade ONLY.
// Paste your final $project stage here.
// Answer:
//   // $project: {
//   //   _id: 0,
//   //   ...
//   // }
// C2) Using the $lookup with pipeline variant, add a predicate to include ONLY courses with credits >= 3.
// Paste the $lookup block you used.
// Answer:
//   // $lookup: { from: "courses", let: { ... }, pipeline: [ { $match: { $expr: { ... } } }, ... ], as: "course" }
// --------------------------------------------------------
// PART D — Performance Harness Results (.explain("executionStats"))
// Run BEFORE creating indexes and AFTER creating the suggested indexes.
// Record metrics below. If plan JSON is huge, attach screenshots.
//
// D1) Simple find (major="Computer Science")
// | Metric                 | BEFORE | AFTER |
// |------------------------|--------|-------|
// | winningPlan.stage      |        |       |
// | totalKeysExamined      |        |       |
// | totalDocsExamined      |        |       |
// | executionTimeMillis    |        |       |
//
// D2) $match early vs late (aggregate)
// Paste explain summaries or key fields indicating work difference.
// Answer:
//   -
//
// D3) $lookup performance (enrollments→courses)
// | Metric                 | BEFORE | AFTER |
// |------------------------|--------|-------|
// | left side IXSCAN?      |        |       |
// | totalKeysExamined      |        |       |
// | totalDocsExamined      |        |       |
// | executionTimeMillis    |        |       |
//
// D4) Orphan detection plan
// Summarize whether indexes changed plan shape or reduced scans.
// Answer:
//   -
// --------------------------------------------------------
// PART E — Reflection & Design Trade‑offs
// E1) If course titles change often, which model minimizes write‑amplification? Why?
// Answer:
//   -
// E2) If you need fast "student → all courses + grades" reads, which model is fastest on average? What are the trade‑offs?
// Answer:
//   -
// E3) List two real production risks when relying only on application‑level referential integrity.
// Answer:
//   -
//   -
// E4) Name two Mongo features that help approximate SQL behavior (e.g., joins, window functions) and when to use them.
// Answer:
//   -
//   -
// --------------------------------------------------------
// Submission Checklist (TA quick scan)
// [ ] A: Modeling answers
// [ ] B: Orphan detection run + mitigation
// [ ] C: Correct selective‑fields join
// [ ] D: BEFORE/AFTER explain metrics or screenshots
// [ ] E: Reflection questions
// --------------------------------------------------------
