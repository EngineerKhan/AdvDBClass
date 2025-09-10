

-- ---------------------------
-- DDL (Data Definition Language)
-- ---------------------------

-- Create a table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    published_year INT,
    genres TEXT[]
);

-- Alter table: add a new column
ALTER TABLE books ADD COLUMN publisher VARCHAR(255);

-- Drop table
-- DROP TABLE books;

-- ---------------------------
-- DML (Data Manipulation Language)
-- ---------------------------

-- Insert data
INSERT INTO books (title, author, published_year, genres, publisher)
VALUES
('Book A', 'Author 1', 2015, ARRAY['Fiction', 'Drama'], 'Publisher X'),
('Book B', 'Author 2', 2020, ARRAY['Math', 'Science'], 'Publisher Y');

-- Update data
UPDATE books
SET publisher = 'Updated Publisher'
WHERE id = 1;

-- Delete data
DELETE FROM books WHERE id = 2;

-- Select all books
SELECT * FROM books;

-- Select specific columns
SELECT title, author FROM books;

-- Filter books published after 2018
SELECT * FROM books WHERE published_year > 2018;

-- Find books where genres include 'Math'
SELECT * FROM books WHERE 'Math' = ANY(genres);

-- Count number of books
SELECT COUNT(*) FROM books;

-- Order books by published year descending
SELECT * FROM books ORDER BY published_year DESC;


-- ---------------------------
-- Constraints & Relationships
-- ---------------------------

-- Create authors table
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100)
);

-- Create publishers table
CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100)
);

-- Re-create books table with foreign keys
DROP TABLE IF EXISTS books CASCADE;
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author_id INT REFERENCES authors(id) ON DELETE SET NULL,
    publisher_id INT REFERENCES publishers(id) ON DELETE SET NULL,
    published_year INT,
    genres TEXT[]
);

-- Insert sample authors and publishers
INSERT INTO authors (name, country) VALUES
('Author 1', 'USA'),
('Author 2', 'UK');

INSERT INTO publishers (name, country) VALUES
('Publisher X', 'USA'),
('Publisher Y', 'UK');

-- Insert books linked by foreign keys
INSERT INTO books (title, author_id, publisher_id, published_year, genres)
VALUES
('Book A', 1, 1, 2015, ARRAY['Fiction', 'Drama']),
('Book B', 2, 2, 2020, ARRAY['Math', 'Science']);

-- ---------------------------
-- Example JOIN Queries
-- ---------------------------

-- Join books with authors
SELECT b.title, a.name AS author, b.published_year
FROM books b
JOIN authors a ON b.author_id = a.id;

-- Join books with publishers
SELECT b.title, p.name AS publisher, b.published_year
FROM books b
JOIN publishers p ON b.publisher_id = p.id;

-- Join books with authors and publishers
SELECT b.title, a.name AS author, p.name AS publisher, b.published_year
FROM books b
JOIN authors a ON b.author_id = a.id
JOIN publishers p ON b.publisher_id = p.id;

