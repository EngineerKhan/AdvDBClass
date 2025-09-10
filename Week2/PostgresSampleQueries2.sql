-- ---------------------------
-- STORED PROCEDURE / FUNCTION
-- ---------------------------

-- Function to get all books by a given author
CREATE OR REPLACE FUNCTION get_books_by_author(author_name VARCHAR)
RETURNS TABLE(title VARCHAR, published_year INT) AS $$
BEGIN
    RETURN QUERY
    SELECT b.title, b.published_year
    FROM books b
    JOIN authors a ON b.author_id = a.id
    WHERE a.name = author_name;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT * FROM get_books_by_author('Author 1');


-- ---------------------------
-- TRIGGERS
-- ---------------------------

-- Example: keep track of last updated timestamp
ALTER TABLE books ADD COLUMN last_updated TIMESTAMP;

-- Create trigger function
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_last_updated
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_last_modified();


-- ---------------------------
-- VIEWS
-- ---------------------------

-- Create a view showing book details with author and publisher names
CREATE OR REPLACE VIEW book_details AS
SELECT b.id AS book_id,
       b.title,
       b.published_year,
       a.name AS author,
       p.name AS publisher
FROM books b
LEFT JOIN authors a ON b.author_id = a.id
LEFT JOIN publishers p ON b.publisher_id = p.id;

-- Usage:
-- SELECT * FROM book_details;


-- ---------------------------
-- INSTEAD OF TRIGGER on a VIEW
-- ---------------------------

-- Example: allow updates on book_details view to propagate to books table
CREATE OR REPLACE FUNCTION update_book_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the books table when view is updated
    UPDATE books
    SET title = NEW.title,
        published_year = NEW.published_year
    WHERE id = OLD.book_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach INSTEAD OF trigger to the view
CREATE TRIGGER book_details_update
INSTEAD OF UPDATE ON book_details
FOR EACH ROW
EXECUTE FUNCTION update_book_details();

-- Usage:
-- UPDATE book_details SET title = 'Updated Title' WHERE title = 'Book A';

-- ---------------------------
-- INSTEAD OF INSERT on a VIEW
-- ---------------------------

-- Allow inserting into book_details view; will upsert author/publisher if needed
CREATE OR REPLACE FUNCTION insert_book_details()
RETURNS TRIGGER AS $$
DECLARE
    v_author_id INT;
    v_publisher_id INT;
BEGIN
    -- Upsert/find author
    SELECT id INTO v_author_id FROM authors WHERE name = NEW.author;
    IF v_author_id IS NULL THEN
        INSERT INTO authors(name) VALUES (NEW.author) RETURNING id INTO v_author_id;
    END IF;

    -- Upsert/find publisher
    SELECT id INTO v_publisher_id FROM publishers WHERE name = NEW.publisher;
    IF v_publisher_id IS NULL THEN
        INSERT INTO publishers(name) VALUES (NEW.publisher) RETURNING id INTO v_publisher_id;
    END IF;

    -- Insert into books
    INSERT INTO books(title, author_id, publisher_id, published_year)
    VALUES (NEW.title, v_author_id, v_publisher_id, NEW.published_year);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach INSTEAD OF INSERT trigger to the view
CREATE TRIGGER book_details_insert
INSTEAD OF INSERT ON book_details
FOR EACH ROW
EXECUTE FUNCTION insert_book_details();

-- Usage:
-- INSERT INTO book_details (title, author, publisher, published_year)
-- VALUES ('New Sample Book', 'Author 3', 'Publisher Z', 2024);

-- ---------------------------
-- INSTEAD OF DELETE on a VIEW
-- ---------------------------

-- Allow deleting through book_details view; removes row from books
CREATE OR REPLACE FUNCTION delete_book_details()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM books
    WHERE id = OLD.book_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Attach INSTEAD OF DELETE trigger to the view
CREATE TRIGGER book_details_delete
INSTEAD OF DELETE ON book_details
FOR EACH ROW
EXECUTE FUNCTION delete_book_details();

-- Usage examples:
-- DELETE FROM book_details WHERE book_id = 1;
-- DELETE FROM book_details WHERE title = 'Book A';