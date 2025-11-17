One of the mid-term groups (B, I reckon?) had MongoDB Aggregation Pipeline explicitly mentioned as a requirement for the mini-project. And I was surprised by the feedback, actually. Many of students told me they enjoyed working on it. That’s good and I think other students also deserve to know a bit about MongoDB’s aggregation pipelines.

This week, thanks to the bizarre scheduling by Comsats, is going to be isolated, so I decided to dedicate it to the MongoDB’s pipelines. 

## What are Aggregation Pipelines?

MongoDB itself defines them as:

> An aggregation pipeline consists of one or more **[stages](https://www.mongodb.com/docs/manual/reference/mql/aggregation-stages/#std-label-aggregation-pipeline-operator-reference) that process documents**. These documents can come from a collection, a view, or a specially designed stage.
> 

Here, a couple of things are worthy of attention.

1. These pipelines aren’t restricted to aggregation functions – we can have a purely *normal* pipeline (one without any aggregation function, having simple queries).
2. We can nicely break down complex operations into sequential stages

## Basic Operators and Examples

I will make sure to not make it a cheatsheet of operators and keep it relevant. It's always useful to have a table showing the SQL equivalents.

| SQL          | MongoDB  |
|--------------|----------|
| **SELECT**   | `$project` |
| **JOIN**     | `$lookup`  |
| **WHERE**    | `$match `  |
| **GROUP BY** | `$group`   |
| **ORDER BY** | `$sort`    |
| **UNION**    | `$unionWith`|




### `$project`

The most basic operation, `$project` is similar to SELECT in SQL. We can specify the columns we want by setting them as 1.

> 1 and -1 are respectively used to declare a condition as true or false. 

Now let's put it into practice. 
I am using here (a subset of) the real flights data we use in our app and beginning by simply selecting a few attributes.

```jsx
[
  {
    $project: {
        origin: 1, 
        destination: 1, 
        flightCode: 1, 
        airline: 1, 
        aircraft: 1, 
        distance: 1, 
        duration: 1,
    }
  }
]
```

![](MongoDB Blog/Screenshot%202025-11-17%20at%206.18.22%E2%80%AFPM.png)

Now, I would try some examples in a [curriculum learning](https://en.wikipedia.org/wiki/Curriculum_learning) manner, building them incremently.

**Example 1: Getting all flights flying A380**

Being an aviation geek, I would be naturally curious to check which flights fly a certain aircraft
– like my fav A380, so lets put `$match` to use.

```jsx
{
    $match: {
        aircraft: "A388"
    }
}
```

![Emirates has a lion's share in the A380s](MongoDB Blog/Screenshot%202025-11-17%20at%206.24.04%E2%80%AFPM.png)

**Example 2: A350-1000 flights for Qatar Airways**

We can add some more filters like airline, airport, etc, too. For example, this one will check all flights flying A350–1000 for Qatar Airways.

```jsx
{
    $match: {
        aircraft: "A35K"
            airline: "QR"
    }
}
```

It will show a long list of all the flights flying this particular aircraft for Qatar. 
Maybe, it would be even better to check the statistics directly i.e, the total flights – fulfilling these criteria – count.
So, we will use `$group` here. 

Here, I will pause and explain it a bit (this narration style is reminding me of _Thousand and One Nights_ or _Chahar Darvesh_ – albeit with a smaller stack size). I know most of you guys would be well-versed in `GROUP BY` already; having a little look on `$group` will ensure you can translate it into MongoDB as well.

---

### `$group`

`$group` is similar to GROUP BY, but more powerful. Its basic syntax is:

```jsx
{
  $group: {
    _id: <expression>,     // how you want to group
    <outputField>: { <accumulator>: <value> }
  }
}
```

Like `$group` in our case would be:

```jsx
{$group: {
    _id: "$airline",
    flightsCount: {
      $sum: 1
    }
  }
}
```

And it will simply return:
```jsx
{
  _id: "A35K",
  flightsCount: 41
}
```

Since we are grouping on the airline, so there will be a single aggregated output (aggregation functions are nothing but summarized stats). If we try some other choice of ids, we can see some other groupings too, like:

```jsx
{
    $group: {
      _id: "$origin",
      flightsCount: {
        $sum: 1
      }
    }
  }
```
![_id in $group enables us to group by different attributes](MongoDB Blog/Screenshot%202025-11-17%20at%207.12.50%E2%80%AFPM.png)

### `$match` as HAVING clause

I just want to see those airports which have atleast 2 flights for this aicraft+airline combination. We can use `$match` for `HAVING` clause here as:


```jsx
{
    $match: {
        flightsCount: {
            $gte: 2
        }
    }
}
```

![$match can be used both for SQL's WHERE and HAVING counterparts](MongoDB Blog/Screenshot%202025-11-17%20at%207.21.00%E2%80%AFPM.png)

---


### Joins using `$lookup`

One of the biggest misunderstanding in my mind about MongoDB was its inability to join like SQL. 
Turns out I was (luckily) incorrect and all we need is to _lookup_ the foreign ~~table~~ collection.

In my MongoDB, I have a collection for airports and naturally, I would be curious to see respective attributes, like city's name. We can avail `$lookup` there.

Lookup takes the form of:

```jsx
{
  $lookup: {
    from: "collection",
    localField: "field",
    foreignField: "field",
    as: "resultAlias"
  }
}
```

Its pretty self-explanatory. If we use it, our whole pipeline JSON would be:

```jsx
[
  {
    $project: {
      origin: 1,
      destination: 1,
      airline: 1,
      aircraft: 1,
      flightCode: 1
    }
  },
  {
    $lookup: {
      from: "airports",
      localField: "origin",
      foreignField: "iataCode",
      as: "originDetails"
    }
  }
]
```

If you look closely at the results, they will show `originDetails` as an `Array`. We can expand it and see the whole airport object.

![The joined Array is a complete airport object](MongoDB Blog/Screenshot%202025-11-17%20at%207.44.27%E2%80%AFPM.png)

If we want to see any of the airports' attribute, like city or country name, we have to flatten it using `$unwind`. 
After unwinding it, we can select the foreign collection's attributes as well.

```jsx
{
    $unwind: "$originDetails"
  },
  {
    $project: {
      origin: 1,
      destination: 1,
      airline: 1,
      aircraft: 1,
      flightCode: 1,
      "originDetails.city": 1
    }
  }
```

![](MongoDB Blog/Screenshot%202025-11-17%20at%207.53.52%E2%80%AFPM.png)

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


> `$unwind` isn’t needed for aggregation functions when your data is already in a relational format (1:1 mapping).



### `$unionWith`

It's just like SQL's **`UNION`**. It simply stacks the two collections (can be the same collection too) on each other and returns the results. For a simple SQL `SELECT * FROM tableA UNION SELECT * FROM tableB` ,  we can have the equivalent MongoDB query:

```jsx
[
  { $unionWith: { coll: "collectionB" } }
]
```

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

