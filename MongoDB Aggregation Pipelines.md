One of the mid-term groups (B, I reckon?) had MongoDB Aggregation Pipeline explicitly mentioned as a requirement for the mini-project. And I was surprised by the feedback, actually. Many of students told me they enjoyed working on it. That’s good and I think other students also deserve to know a bit about MongoDB’s aggregation pipelines.

This week, thanks to the bizarre scheduling by Comsats, is going to be isolated, so I decided to dedicate it to the MongoDB’s pipelines. 

## What are Aggregation Pipelines?

MongoDB itself defines them as:

> An aggregation pipeline consists of one or more **[stages](https://www.mongodb.com/docs/manual/reference/mql/aggregation-stages/#std-label-aggregation-pipeline-operator-reference) that process documents**. These documents can come from a collection, a view, or a specially designed stage.
> 

Here, a couple of things are worthy of attention.

1. These pipelines aren’t restricted to aggregation functions – we can have a purely *normal* pipeline (one without any aggregation function, having simple queries).
2. We can nicely break down complex operations into sequential stages

## Basic Operators

I will make sure to not make it a cheatsheet of operators and keep it relevant. It's always useful to have a table showing the SQL equivalents.

| SQL          | MongoDB  |
|--------------|----------|
| **SELECT**   | `$project` |
| **JOIN**     | `$lookup`  |
| **WHERE**    | `$match `  |
| **GROUP BY** | `$group`   |
| **ORDER BY** | `$sort`    |
| **UNION**    | `$unionWith`|

---


### `$project`

The most basic operation, `$project` is similar to SELECT in SQL. We can specify the columns we want by setting them as 1.

> 💡1 and -1 are respectively used to declare a condition as true or false.

### `$lookup`

Lookup is used for SQL JOIN. 

Like, I am joining the flights table to airports one as:

```sql
SELECT r.origin, a.city, a.country
FROM routes r
JOIN airports a
ON r.origin = a.code;
```

The same join in MongoDB would be:

```jsx
[
  {
    $lookup: {
      from: "flights",
      localField: "origin", 
      foreignField: "code", 
      as: "airportInfo"
    }
  }, 
  { $unwind: "$airportInfo" }, 
  { $project: { origin: 1, city: "$airportInfo.city", country: "$airportInfo.country" } }
]
```

### `$unwind`

Here, unwind deserves a special mention. It has a beautiful theory behind it. Consider a MongoDB document storing an airport and its connections.

```json
{
  "airport": "LHE",
  "destinations": ["DOH", "DXB", "IST"]
}
```

While it makes it easier to store the data, this design also means that joining two documents can be troublesome. So it just normalizes the data back into the atomic form (1NF):

```json
{ "airport": "LHE", "destination": "DOH" }
{ "airport": "LHE", "destination": "DXB" }
{ "airport": "LHE", "destination": "IST" }
```

A natural question may arise that what’s the deal? Can’t we access the destinations in the compact/unnormalized form? Yes, we can access them but can’t apply aggregation over them. Unwind is specific for aggregation pipelines (otherwise `{airport: "LHE"}` will work fine). An excellent example/analogy would be an Excel file. We can’t calculate SUM(), MAX(), etc when a single cell contains multiple entries (even if they are numeric). But its doable once we “unwind” it.


> ⚠️ `$unwind` isn’t needed when your data is already in a relational format (1:1 mapping).



### `$unionWith`

It's just like SQL's **`UNION`**. It simply stacks the two collections (can be the same collection too) on each other and returns the results. For a simple SQL `SELECT * FROM tableA UNION SELECT * FROM tableB` ,  we can have the equivalent MongoDB query:

```jsx
[
  { $unionWith: { coll: "collectionB" } }
]
```

---

## Use Case

As you can see, I kept the operators' part pretty concise. Now let's put it into practice. I am using here (a subset of) the real flights data we use in our app.

<TBC>



---

## Query Optimization

While query optimization itself is a whole field (and even a 16-week semester is insufficient for it; comes with experience). There are some general practices we can follow. I can’t claim that this list is exhaustive, but I will try to recall and add as much as I can.

### 1. To index or not to index

Indexing is a good thing, especially in the context of joins ($lookup). If there’s a certain column which is highly liked to be used as a `foreignField` – like an airport will always be recognized by its IATA code, so it must be indexed (default, asc). 

On the other hand, there are downsides of indices too.

- **Slower writes:** It basically depends on the application. Like, in my case, I know that airport or airline etc data is rarely going to update, so I won’t bother much about the indices. But I need to be extra careful about indices if mkaing some constantly updating collection (like for some online shopping system or airplane tracking system, etc).
- **Storage:** Its possible that indices outgrow the data. No wonder why MongoDB heavily emphasizes on making indices (tongue-in-cheek comment: since they want us to use it beyond the free 2GB tier).
- **Confusing the query planner:** Having too many and overlapping indices means query planner will have to choose an optimum path, and its not guaranteed to be the optimal one.

> If you are unsure whether to make one or not, ~~flip the co..~~ incline towards making an index.

### 2. Filtering data early

By using `$match` and `$project` early, we can filter the collection down to only what’s needed (`$match` will ensure which documents and `$project` will further filter the attributes) before performing expensive join operations.

And you guys need to keep one thing in mind: Use **`$project`** early only for the filtering. Don’t use heavy `$project` or drop large arrays early.

### 3. Careful use of `$unwind`

As I already mentioned above, there is no need to use `$unwind` for 1:1 relationships. 
A natural counter-question may arise that what’s the harm if they are 1:1 relations? Let me explain.

#### Computational Overhead

Unwind always returns an array (even if it has a single element for 1:1 relations), leading to extra computational overhead. Also, pipeline becomes stateful and hence slower.
The alternative **`$arrayElemAt`** is much cheaper – $O(1)$. Unwind’s iteration is $O(nK)$

> A stateful pipeline refers to one where MongoDB must materialize every document into memory. As a result, covered query optimization’ support isn’t there anymore.


#### Restricted Support

Using `$unwind` means we can’t apply some operations. For example, `$lookup`+`$project` as a single join.


> Even for 1:many relations, use unwind only when you need to access the nested elements/children too. Its real power lies in **aggregate functions over children**.

