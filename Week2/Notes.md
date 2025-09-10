## To DB or not to DB

Had Shakespeare been a developer, he would have come across this discourse at some time. But luckily, he wasn't, allowing me an opportunity to present it here.

After taking a course on DB, you have a handsome knowledge about databases and SQL. Many of you will be able to answer *how to* use, manage, deploy or backup a db.
But you may still need to ask yourself some questions, like:

- Why use a DB?
- When should we prefer files over a DB (and vice versa)?
- When should we use a DB beyond RDBMS?
- How to choose the right DB for the job?

While there is not a precise Mathematics answer to all of these questions, there are some general guidelines that can help you.

### 1. Files over DB

Plain files such as CSV, JSON, or log files might be preferable over a database in scenarios where simplicity and ease of use are priorities. For example, if the data volume is low and does not require complex querying or transactional integrity, storing data in files can be more straightforward and require less overhead. Files are also highly portable and can be easily shared or moved across systems without the need for a database server. Additionally, for quick prototyping, logging, or when data is primarily used for batch processing or archival purposes, files can be an efficient choice.

### 2. Which File Format to Use?

Choosing the right file format depends on the nature of your data and how you intend to use it. CSV is simple and widely supported, ideal for tabular data and interoperability with spreadsheets but lacks support for nested structures. JSON supports hierarchical data and is human-readable, making it suitable for configuration files or APIs. XML also supports complex nested data and includes metadata through attributes, but it tends to be more verbose and harder to parse. Parquet and other columnar formats are optimized for big data analytics, offering efficient compression and faster query performance on large datasets but are less human-readable. Selecting a format involves balancing readability, complexity, performance, and compatibility with your tools.

### 3. Which DB to Use?

When choosing a database, consider factors like data size, schema flexibility, performance requirements, and scaling needs. For structured data with a fixed schema and strong ACID (Atomicity, Consistency, Isolation, Durability) guarantees, relational databases like PostgreSQL or MySQL are excellent choices. If your data is semi-structured or schema-less, and you require flexible document storage, a NoSQL database like MongoDB might be more appropriate. For use cases demanding extremely fast in-memory data access, such as caching or real-time analytics, Redis is a good fit. Additionally, consider your scaling needs: some databases scale vertically, while others are designed for horizontal scaling across distributed systems.

### 4. RDBMS vs NoSQL

Relational Database Management Systems (RDBMS) organize data into tables with predefined schemas and support complex joins and transactions, making them well-suited for applications requiring data integrity and consistency, such as financial systems. However, they can be less flexible when dealing with rapidly evolving or unstructured data. NoSQL databases, on the other hand, use non-relational models like key-value, document, column-family, or graph structures, offering schema flexibility and easier horizontal scaling. They excel in handling big data, real-time web applications, and situations where the data model evolves frequently. The trade-off is that many NoSQL systems sacrifice some consistency guarantees for performance and scalability. Choosing between them depends on your specific application needs and data characteristics.


### 5. When to Use a DB

Databases are preferable in scenarios where data integrity, concurrency, scalability, and complex querying are critical. Here are some typical examples:

- **Handling Concurrent Users:** When multiple users need to access and modify data simultaneously, databases provide mechanisms like locking, transactions, and isolation levels to maintain consistency. For instance, an e-commerce site using PostgreSQL manages products, orders, and payments with ACID guarantees, ensuring that inventory counts and payment records remain accurate despite concurrent purchases.

- **Ensuring Data Integrity:** Applications that require strict data validation, constraints, and relationships benefit from relational databases. A financial trading system relies on RDBMS to maintain transaction integrity, ensuring that trades are recorded accurately and comply with regulatory requirements.

- **Scaling Applications:** As applications grow, databases that support horizontal scaling or sharding become essential. For example, a social media app might use MongoDB to store user profiles and posts due to its flexible schema and ability to scale out across multiple servers.

- **Supporting Complex Queries:** When applications need to perform sophisticated queries, joins, and aggregations, relational databases excel. They allow developers to write powerful SQL queries to extract meaningful insights from structured data.

- **Real-Time Data Access:** Some applications require extremely fast, in-memory data retrieval. A ride-sharing platform might use Redis for real-time driver-passenger matching, leveraging its low latency and high throughput capabilities.

In summary, the choice to use a database depends on your workload and requirements. Databases shine when reliability, concurrency, and scalability are important, providing robust tools to manage complex and growing datasets efficiently.

---

## Postgres

Postgres is a preferred DBMS for this course. While MS SQL Server has an excellent management studio, it doesn't like other platform users (Linux or Mac), so its 
necessary to learn how to use some other free RDBMS too. Postgres is just one of them. There can be many other RDBMS too.

> **Note:** Since most of you are comfortable working in MS SQL Server, you can build all the schema and db objects there and then
> port them to Postgres/some other database later on.

## MongoDB

Matrices or tables are ideal to visualize and understand. But not every data is (or should be) in the tabular form. 
We have already discussed that flexible or semi-structured data is more suited to NoSQL databases. 

### Comparison with RDBMS

Task |	SQL (Postgres) |	MongoDB 
-----|---|---
Create DB |	CREATE DATABASE school;	| use school;
Create Table |	CREATE TABLE students...	| db.createCollection("students")
Insert	| INSERT INTO students...	| db.students.insertOne()
Query GPA > 3.5	| SELECT * FROM students WHERE gpa > 3.5;	| db.students.find({ gpa: { $gt: 3.5 } })
Join	| SELECT ... JOIN ...	| $lookup in aggregation
Transaction	| BEGIN ... COMMIT;	| session.startTransaction()
------------------------------


 