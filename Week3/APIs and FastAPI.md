## APIs

Application Programming Interface (APIs onwards) is a way for software to communicate with other software via a well-defined contract (an *interface*). 

Before going into any complexity, we can start with a basic example and think of an API as a railway track. A train can only move from a station, let’s say Paris, to another station, say Geneva, if the railway track is uniform. By uniform, we mean that the track’s width is the same (different countries may have different track widths). The successful idea of Euro-rail works because track widths are standardized across much of Europe.

### JSONs

Similarly, for passing data across applications, it’s necessary that our data format is well-defined and consistent. CSVs can work but are brittle (ordering/escaping issues), so APIs typically use structured formats like JSON (most common today) or XML (still widely used in specific domains).

For JSON **objects**, the *order* of fields does not matter; what matters is the presence, names, and types of fields according to the contract (schema).

JSON is a robust data format and is widely used in APIs.

For example, the server is sending a simple JSON object with 2 fields, name and age. 
The client should expect these fields (names and types) — the order of keys doesn’t matter.

Server's side:
```js
{
    "name": "John",
    "age": 25
}
```

Client's side:
```js
{
"name": "John",
"age": 25
}
```

> I remember back in 2012, I worked on a project for the Packages company. They had a legacy system (written in VB) for their main packaging plant and one from a German company and used **XML** for connecting them.
> Once they encountered some issues in the XML inconsistency. It took me 3–4 days, and finally the issue was fixed.
> But today, when I reflect back on that, I can laugh at myself (more on them) that why we didn’t implement a JSON-based API in the first place.


### API Types
APIs can be of different types: public, paywall, internal.

The most basic type of API is a public API. It’s an API that’s openly documented and accessible. Many public APIs are free to use **but still require an API key** (e.g., NASA). Others are truly open and require no key (e.g., Open-Meteo, Cat Facts). Some platforms (e.g., X/Twitter) now require paid tiers for meaningful access.

> Many public APIs require authentication. Keys/tokens help with rate limiting, quotas, and analytics (who’s calling what and how often).

There are also APIs behind a paywall, like the OpenAI API. Some APIs are purely internal and exist only to connect components within a company’s systems.

In terms of calling, APIs can be categorized into 2 types:
- **REST APIs** (resource-oriented over HTTP)
- **GraphQL APIs** (client-driven queries)

Since most APIs are made over HTTP/HTTPS, operations are usually described using HTTP methods:
- **GET** — read/retrieve
- **POST** — create or execute an action
- **PUT** — replace an entire resource
- **PATCH** — partially update a resource
- **DELETE** — remove a resource

(_For simple examples we’ll mostly use **GET**, but real APIs rely heavily on **POST**, **PUT/PATCH**, and **DELETE** as well._)


### Accessing APIs

To access an API, we need to know the API's url first.
For example, if we want to access some tweets from Twitter, we can use the URL: https://api.twitter.com/2/tweets (don't open it yet; it will require authentication). 
Beyond browsers, we can use some sophisticated clients to access APIs as well, like:

- **Postman** (a popular API client)
- Insomnia
- cURL (command line tool)
- Our own custom client (written in Python, C#, Java, etc.)
- etc.

---

## Making API Server

Let’s keep it short and focus on the core topic: making an API server.
To make an API server, we need to know some basic concepts. We will be considering a bookstore as an example.

### Endpoints

Endpoints are the actual URLs that we use to access the API. Like the URL above, we can access the tweets using the endpoint: `/2/tweets` (`api.twitter.com` is the base URL and will remain the same for all the endpoints).

In the case of the bookstore, we can have endpoints to fetch books, authors, or book prices, like:
- `/books`
- `/authors`
- `/bookprices`



### Parameters


The `/books` endpoint will return all the books in the bookstore. But what if we want to filter the books based on some author, genre, etc.?
For this, we can use parameters—conceptually similar to filtering in SQL. 

#### Query Parameters

Query parameters are appended to the endpoint URL (after the \?). For example, to fetch all the books by a particular author: 
`/books?author=John`
You can include multiple query parameters, e.g.: 
`/books?author=John&genre=Fiction`
There is no standard **OR** operator in query strings. If you need OR logic, you typically repeat the parameter (e.g., `author=John&author=Jane`), accept a comma‑separated list (e.g., `author=John,Jane`), or design the API to support arrays (e.g., `/books?author=John&author=Jane`).

#### Path Parameters

If we want to fetch a particular book, we could use a query parameter like `books?id={bookId}` or fetch an author’s books with `books?author={authorId}`.

However, if an endpoint is specifically for a single book or an author’s books, it’s clearer to encode those identifiers in the path—using **path parameters**.

For example, if we want to fetch a particular book, we can use the `/books/{bookId}` endpoint. Now `{bookId}` is part of the endpoint URL.
Similarly, if we want to fetch the books of a particular author, we can use the `/authors/{authorId}/books` endpoint.

> **Personal note:** I am a camel case fan, but you aren't supposed to be.

## FastAPI

Let's jump to implementation. We can use a lot of programming languages and libraries to implement an API server. 
We’ll use Python’s FastAPI for this.

### Installation


For today's lab, install the following libraries:
- fastapi
- uvicorn
- pydantic
- pandas

> If you haven't made a virtual environment for the lab yet, I would personally recommend making one now. It will continue throughout the semester.


If you prefer using Python directly, you can use the following commands to make a virtual environment and install the libraries:

```commandline
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn[standard] pydantic pandas
```

> If you are using Windows, you can use `.\.venv\Scripts\activate` instead of `source .venv/bin/activate`

Once you have installed the libraries, verify the installation:
```commandline
uvicorn --version
python -c "import fastapi; print(fastapi.__version__)"
```

### Basic Example
For making a basic API server, we will make a new Python file and import the FastAPI library. To make an API server, we need
to have a `FastAPI` object.

```python
from fastapi import FastAPI

app = FastAPI()
```

Now this `app` object is our API server. We can use it to define our endpoints. 
For defining an endpoint, we need to use the `@app.get()` decorator and specify the endpoint URL.
As a most basic example, we can define the entry endpoint, `/`

```python
@app.get("/")
```

Since Python decorators expect a function as an argument, we can either use a function or a $\lambda$ function to define the endpoint.
For example, we can define the entry endpoint as:

```python
@app.get("/")
def root():
    return {"message": "In the name of Allah!"}

```
As you can see here, we return a Python dictionary (`{...}`) and FastAPI serializes it to JSON. (JSON is the most common API response format, but not the only one.)

> Please use PyCharm, VS Code, or any other IDE for this lab. Jupyter notebooks are not ideal for running a FastAPI server with Uvicorn.

Lets define another endpoint, `/books`

```python
@app.get("/books")
def return_books():
    return [
        {"id": 31, "title": "The Count of Monte Cristo"},
        {"id": 45, "title": "The Hobbit"},
        {"id": 81, "title": "The Lord of the Rings"},
    ]
```

### Running the API server

Now this toy example can run as:

`uvicorn main:app --reload`

Here `main` is the Python file's name and `app` is the `FastAPI` object. `--reload` is an optional argument that reloads the server whenever the code is changed.

Now, if we open the browser and go to `http://localhost:8000/books`, we should see the response:

```json
[
  {"id": 31, "title": "The Count of Monte Cristo"},
  {"id": 45, "title": "The Hobbit"},
  {"id": 81, "title": "The Lord of the Rings"}
]
```

_(To be continued; will be updated soon)_

---
