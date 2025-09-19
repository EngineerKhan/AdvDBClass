## APIs

Application Programming Interface (APIs onwards) is a way to communicate with other applications. 

Before going into any complexity, we can start with a basic example and think of an API as railway track. 
A train can only move from a station, lets say Paris, to another station, say Geneva, if the railway track is uniform. 
By uniform, we mean that the track's width is the same (different countries may have different track widths) and this amazingly 
successful idea of Euro-rail is only achieveable due to the same track widths across the Europe.

### JSONs

Similarly, for passing the data across applications, its necessary that our data format should be uniform. 
If we are sending a CSV with 7 fields from the server, client(s) should be expecting the same number (and order) of fields as well.
CSVs are not a reliable format, usually and we use some more reliable/robust formats like XML (becoming obsolete now) and JSON. JSON is an excellent robust data format and is widely used in APIs.

For example, the server is sending a simple JSON object with 2 fields, name and age. 
The client is expecting the same 2 fields in the same order.

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
> Once they encountered some issues in the XML inconsistency. It took me 3–4 days and finally the issue was fixed.
> But today, when I reflect back on that, I can laugh at myself (more on them) that why didn't we implement a JSON-based API in the first place.


### API Types
APIs can be of different types: public, paywall, internal.

The most basic type of API is a public API. Its an API we can use without any fee. There are so many public APIs out there (like NASA, Twitter, etc.).

> Most of these APIs are public but require authentication to access the data. This authentication (alongwith other metadata) is used by them to get some analytics based on the usage of the API. 
Remember, companies are making more these days by selling analytics data to their corporate customers than from the end-users, like chatGPT

There are also some APIs that are behind a paywall, like OpenAPI. Also, there are some APIs which are made purely for interfacing across the different components of their (internal) software. 
These APIs are internal to the company and not exposed to the public.

In terms of calling, APIs can be categorized into 2 types:
- **REST APIs**
- GraphQL APIs

REST APIs are the most common APIs. GraphQL APIs are more advanced and are used by some of the big companies like Facebook, Netflix, etc.

Since API calls are made over HTTP/HTTPS, they are usually categorized wrt HTTP methods:
- **GET**
- **POST**
- **PUT**
- **DELETE**

(_Unless specified explicitly, all the APIs we use are **GET**_).


### Accessing APIs

To access an API, we need to know the API's url first.
For example, if we want to access some tweets from Twitter, we can use the URL: https://api.twitter.com/2/tweets (don't open it yet; it will require authentication). 
Beyond browsers, we can use some sophisticated clients to access APIs as well, like:

- **Postman** (one of the most beautiful software out there)
- Insomnia
- cURL (command line tool)
- Our own custom client (written in Python, C#, Java, etc.)
- etc.

---

## Making API Server

My stories have no end, so I will keep it short and now focus on the ultimate topic: making an API server.
To make an API server, we need to know some basic concepts. We will be considering a bookstore as an example.

### Endpoints

Endpoints are the actual URLs that we use to access the API. Like the URL above, we can access the tweets using the endpoint: `/2/tweets` (`api.twitter.com` is the base URL and will remain the same for all the endpoints).

In the case of the bookstore, we can have the endpoints to fetch books, authors or book prices data, like:
- `/books`
- `/authors`
- `/bookprices`



### Parameters


The `/books` endpoint will return all the books in the bookstore. But what if we want to filter the books based on some author, genre, etc.?
For this, we can use parameters ala you do them using the WHERE clause in SQL. 

#### Query Parameters

Query parameters are the parameters that are appended to the endpoint URL (after the `?`). For example, if we want to fetch all the books by a particular author, we can use the same `/books` endpoint with `author` parameter as `/books?author=John`

We can also have multiple query parameters, like `/books?author=John&genre=Fiction` (just like SQL's WHERE clause with AND operator).

> There is no OR operator in query parameters. But if we want to fetch all the books by a particular parameter, we can use the OR operator in the query parameters. For example, `/books?author=John|Jane`

#### Path Parameters

If we want to fetch a particular book, we can use the `books?id={bookId}` or if we want to fetch the
books of a particular author, we can use `books?author={authorId}`.

But since our endpoint is specifically for fetching a particular book (specified by id) or a particular author's books, it would be better to add those parameters to the endpoint itself. 
For that, we can use path parameters. In path parameters, we can use the parameters in the URL itself.
For example, if we want to fetch a particular book, we can use the `/books/{bookId}` endpoint. Now `{bookId}` is part of the endpoint URL.
Similarly, if we want to fetch the books of a particular author, we can use the `/authors/{authorId}/books` endpoint.

> **Personal note:** I am a camel case fan, but you aren't supposed to be.

## FastAPI

Let's jump to implementation. We can use a lot of programming languages and libraries to implement an API server. 
I will be using Python's FastAPI for this (key reason: I love Python).

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

Once you have installed the libraries, you can verify the installation by running the following on the terminal:
```commandline
uvicorn --version
fastapi --version
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
As you can see here, we have used a Python dictionary (`{...}`) to retun the response, as API responses are always JSONs.

> Please use PyCharm, VS Code, or any other IDE for this lab. JuPyter lab won't work for this.

Lets define another endpoint, `/books`

```python
@app.get("/books")
def returnBooks():
    return {
        {31:"The Count of Monte Cristo"}, 
        {45:"The Hobbit"}, 
        {81:"The Lord of the Rings"}
    }       
```

### Running the API server

Now this toy example can run as:

`uvicorn main:app --reload`

Here `main` is the Python file's name and `app` is the `FastAPI` object. `--reload` is an optional argument that reloads the server whenever the code is changed.

Now, if we open the browser and go to `http://localhost:8000/books`, we should see the response:

```js
{
    {31:"The Count of Monte Cristo"}, 
    {45:"The Hobbit"}, 
    {81:"The Lord of the Rings"}
}       
```

_(To be continued; will be updated soon)_

---
