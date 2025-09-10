// Find all books
db.books.find({})

// Find all books by a specific author
db.books.find({ author: "J.K. Rowling" })

// Find all books published after 2010
db.books.find({ publishedYear: { $gt: 2010 } })

// Find books where genres array contains "Math" and published after 2015
db.books.find({ genres: { $in: ["Math"] }})//, publishedYear: { $gt: 2014 } })

// Find books with either fiction or fantasy genre
db.books.find({ genres: { $in: ["fiction", "fantasy"] } })

// Find books and return only title and author fields
db.books.find({}, { title: 1, author: 1, _id: 0 })

// Find books sorted by published year descending
db.books.find().sort({ publishedYear: -1 })

// Count total number of fiction books
db.books.countDocuments({ genres: "fiction" })

// ---------------------------
// Aggregation Examples
// ---------------------------

// Group books by genre and count how many in each genre
db.books.aggregate([
  { $unwind: "$genres" },
  { $group: { _id: "$genres", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
])
// SQL equivalent:
// SELECT genre, COUNT(*) AS total
// FROM books
// GROUP BY genre
// ORDER BY total DESC;

// Calculate average published year of books per author
db.books.aggregate([
  { $group: { _id: "$author", avgYear: { $avg: "$publishedYear" } } },
  { $sort: { avgYear: -1 } }
])
// SQL equivalent:
// SELECT author, AVG(publishedYear) AS avgYear
// FROM books
// GROUP BY author
// ORDER BY avgYear DESC;

// Find top 5 most prolific authors (by number of books)
db.books.aggregate([
  { $group: { _id: "$author", totalBooks: { $sum: 1 } } },
  { $sort: { totalBooks: -1 } },
  { $limit: 5 }
])
// SQL equivalent:
// SELECT author, COUNT(*) AS totalBooks
// FROM books
// GROUP BY author
// ORDER BY totalBooks DESC
// LIMIT 5;

// ---------------------------
// JOIN-like Examples using $lookup
// ---------------------------

// Join books with authors collection (assumes authors have _id field matching books.authorId)
db.books.aggregate([
  {
    $lookup: {
      from: "authors",
      localField: "authorId",
      foreignField: "_id",
      as: "authorInfo"
    }
  },
  { $unwind: "$authorInfo" },
  { $project: { title: 1, "authorInfo.name": 1, publishedYear: 1 } }
])
// SQL equivalent:
// SELECT b.title, a.name, b.publishedYear
// FROM books b
// JOIN authors a ON b.authorId = a.id;

// Join books with publishers collection
db.books.aggregate([
  {
    $lookup: {
      from: "publishers",
      localField: "publisherId",
      foreignField: "_id",
      as: "publisherInfo"
    }
  },
  { $unwind: "$publisherInfo" },
  { $project: { title: 1, "publisherInfo.name": 1, publishedYear: 1 } }
])
// SQL equivalent:
// SELECT b.title, p.name, b.publishedYear
// FROM books b
// JOIN publishers p ON b.publisherId = p.id;