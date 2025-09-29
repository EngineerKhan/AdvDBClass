## Hybrid Search

Last week, we approached the search problem in our applications.
SQL search is too rigid, as you all have already seen in the DB-I. It's just binary: either the document is relevant or not – there are no half-measures.

Then we saw how vector search employs distance metrics like cosine similarity, $L_2$ distance to find **semantically** relevant documents (notice the difference: we aren't just exactly matching docs, we are finding top-N similar docs).
 
Semantic search is a very powerful technique for finding relevant documents. But, there are often scenarios where we want to **balance exact keyword matches with semantic similarity**.
For example, if someone wants to find the documents containing the *exact phrase* 'New York', but also capture semantically related mentions like 'NYC' or 'Big Apple'.

Imagine you are building a travel app. A user searches 'cheap flights to NYC'. A pure keyword search may miss documents that only mention 'New York', while a pure semantic search may show loosely related content like 'air travel'. Hybrid search combines both worlds, giving users precise yet flexible results.

## Setup

Let's start by importing the necessary libraries, including NLTK and Sentence Transformers.

```python
import math
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple

from nltk import word_tokenize
from sentence_transformers import SentenceTransformer
import re
import nltk
nltk.download('punkt_tab')
from nltk.corpus import stopwords
```

    [nltk_data] Downloading package punkt_tab to /Users/talha/nltk_data...
    [nltk_data]   Package punkt_tab is already up-to-date!


To test the search, we will make some sample documents. Once tokenized, we can feed them into the BM25 model (as it requires term frequencies).

```python
DOCS = [
    "Cheap flights to New York from Dubai. Find the best airfare deals.",
    "Looking for affordable airfare to NYC? Compare ticket prices and airlines.",
    "The football world cup draws millions of fans every four years.",
    "Soccer analytics with xG models and player tracking data.",
    "Intro to artificial intelligence: machine learning and neural networks.",
    "AI applications in travel: dynamic pricing and flight delay prediction.",
    "Visit Istanbul for history, food, and Bosphorus cruises.",
    "New York City travel guide: subway tips, museums, and pizza spots.",
    "Basketball playoffs: New York Knicks advance to conference finals.",
    "Air travel tips: baggage rules, layover strategies, and airport lounges."
]

DOC_IDS = [f"D{i:02d}" for i in range(len(DOCS))]
stop_words = set(stopwords.words('english'))

def Tokenize(text: str) -> List[str]:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    tokens = word_tokenize(text)
    return [word for word in tokens if word.lower() not in stop_words]

tokens = [Tokenize(d) for d in DOCS]
```

## BM25

BM25 is a popular algorithm for retrieving relevant documents. It is based on the idea that documents that contain more relevant terms are more likely to be relevant. It also makes sure to normalize the documents (i.e. the length of the document) to avoid biasing the results.

BM25's implementation is very simple. It is based on the following formula (**feel free to skip this section if you are uncomfortable with Math**):

$$
\text{BM25}(q, d) = \sum_{t \in q} IDF(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \big(1 - b + b \cdot \frac{|d|}{\text{AVGDL}}\big)}
$$

- $f(t, d)$ = frequency of term $t$ in document $d$  
- $|d|$ = length of document $d$  
- $\text{AVGDL}$ = average document length across the corpus  
- $IDF(t) = \log \frac{N - n_t + 0.5}{n_t + 0.5}$ where $n_t$ = number of documents containing $t$  
- $k_1, b$ = tuning parameters (commonly $k_1 = 1.5, b = 0.75$)  

> $IDF(t)$ is called **inverse document frequency** and is used to penalize terms that occur in many documents.

Here is a Python implementation of BM25 (thanks to chatGPT for the code).

```python
"""ChatGPT written code - you can use it verbaitm as it is not directly related to the topic.

"""
# -----------------------------
# Vocabulary & statistics
# -----------------------------
def BuildVocabulary(docs_tokens: List[List[str]]) -> Tuple[Dict[str, int], List[int], Dict[str, int]]:
    vocab = {}
    df = {}  # document frequency
    for toks in docs_tokens:
        seen = set()
        for t in toks:
            if t not in vocab:
                vocab[t] = len(vocab)
            if t not in seen:
                df[t] = df.get(t, 0) + 1
                seen.add(t)
    df_list = [0]*len(vocab)
    for t, i in vocab.items():
        df_list[i] = df[t]
    return vocab, df_list, df

VOCAB, DF_LIST, DF_DICT = BuildVocabulary(tokens)
N_DOCS = len(DOCS)
AVGDL = sum(len(toks) for toks in tokens) / N_DOCS

# Precompute term frequencies per doc (sparse dicts)
DOC_TF = []
for toks in tokens:
    tf = {}
    for t in toks:
        tf[t] = tf.get(t, 0) + 1
    DOC_TF.append(tf)

# -----------------------------
# BM25 (Okapi) implementation
# -----------------------------
def BM25Okapi(query: str, k1=1.5, b=0.75) -> np.ndarray:
    q_tokens = Tokenize(query)
    # Use BM25 idf variant
    idf = {}
    for t in q_tokens:
        n_q = DF_DICT.get(t, 0)
        # BM25+Okapi idf, adding +1 inside log to avoid negatives on very common terms in tiny corpora
        idf[t] = math.log((N_DOCS - n_q + 0.5) / (n_q + 0.5) + 1.0)
    scores = np.zeros(N_DOCS, dtype=float)
    for i, tf in enumerate(DOC_TF):
        dl = sum(tf.values())
        denom_norm = (1 - b) + b * (dl / AVGDL)
        s = 0.0
        for t in q_tokens:
            f = tf.get(t, 0)
            if f == 0:
                continue
            s += idf[t] * ( (f * (k1 + 1)) / (f + k1 * denom_norm) )
        scores[i] = s
    return scores
```
## Vector Search

Now lets perform the already familiar vector search for the comparison.

```python
embedder = SentenceTransformer("all-MiniLM-L6-v2")
embeddingVectors = embedder.encode(DOCS, convert_to_numpy=True, normalize_embeddings=True)

def QueryEmbedding(query: str) -> np.ndarray:
    return embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)[0]

def CosineSimilarity(q_vec: np.ndarray, doc_matrix: np.ndarray) -> np.ndarray:
    return doc_matrix @ q_vec
```

## Hybrid Search

Hybrid search combines the BM25 and semantic search results. To keep the BM25 and semantic search results relevant, we will normalize both scores in the range $[0, 1]$.

$$
\text{Hybrid}(q, d) = \alpha \cdot \text{BM25}(q, d) + (1 - \alpha) \cdot \text{Cosine}(q, d)
$$

> $\alpha$ here is like a knob which can control the balance between BM25 and semantic search.



```python
β = 1e-12

def NormalizeScore(x: np.ndarray) -> np.ndarray:
    mn, mx = x.min(), x.max()
    if mx - mn < β:
        return np.zeros_like(x)
    return (x - mn) / (mx - mn)

def HybridSearch(query: str, α: float = 0.5) -> pd.DataFrame:
    
    bm25Score = NormalizeScore(BM25Okapi(query))
    semanticSimilarity = NormalizeScore(CosineSimilarity(QueryEmbedding(query), embeddingVectors))

    hybridScore = α * bm25Score + (1 - α) * semanticSimilarity

    df = pd.DataFrame({
        "ID": DOC_IDS,
        "Document": DOCS,
        "BM25": bm25Score,
        "Cos Similarity": semanticSimilarity,
        f"Hybrid (α={α:.2f})": hybridScore
    }).sort_values(by=f"Hybrid (α={α:.2f})", ascending=False).reset_index(drop=True)
    return df
```

Now lets try a query. I am using $\alpha = 0.3$ for starters (inclining more towards semantic search).

```python
resultsDF = HybridSearch("cheap flights to New York", α=0.3)

resultsDF
```

We can play around with the $\alpha$ parameter to see how it affects the results.





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>ID</th>
      <th>Document</th>
      <th>BM25</th>
      <th>Cos Similarity</th>
      <th>Hybrid (α=0.30)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>D00</td>
      <td>Cheap flights to New York from Dubai. Find the...</td>
      <td>1.000000</td>
      <td>0.951896</td>
      <td>0.966327</td>
    </tr>
    <tr>
      <th>1</th>
      <td>D01</td>
      <td>Looking for affordable airfare to NYC? Compare...</td>
      <td>0.000000</td>
      <td>1.000000</td>
      <td>0.700000</td>
    </tr>
    <tr>
      <th>2</th>
      <td>D07</td>
      <td>New York City travel guide: subway tips, museu...</td>
      <td>0.346635</td>
      <td>0.709671</td>
      <td>0.600760</td>
    </tr>
    <tr>
      <th>3</th>
      <td>D05</td>
      <td>AI applications in travel: dynamic pricing and...</td>
      <td>0.000000</td>
      <td>0.544978</td>
      <td>0.381485</td>
    </tr>
    <tr>
      <th>4</th>
      <td>D08</td>
      <td>Basketball playoffs: New York Knicks advance t...</td>
      <td>0.385365</td>
      <td>0.363443</td>
      <td>0.370019</td>
    </tr>
    <tr>
      <th>5</th>
      <td>D09</td>
      <td>Air travel tips: baggage rules, layover strate...</td>
      <td>0.000000</td>
      <td>0.451535</td>
      <td>0.316074</td>
    </tr>
    <tr>
      <th>6</th>
      <td>D06</td>
      <td>Visit Istanbul for history, food, and Bosphoru...</td>
      <td>0.000000</td>
      <td>0.295840</td>
      <td>0.207088</td>
    </tr>
    <tr>
      <th>7</th>
      <td>D03</td>
      <td>Soccer analytics with xG models and player tra...</td>
      <td>0.000000</td>
      <td>0.070316</td>
      <td>0.049221</td>
    </tr>
    <tr>
      <th>8</th>
      <td>D02</td>
      <td>The football world cup draws millions of fans ...</td>
      <td>0.000000</td>
      <td>0.059690</td>
      <td>0.041783</td>
    </tr>
    <tr>
      <th>9</th>
      <td>D04</td>
      <td>Intro to artificial intelligence: machine lear...</td>
      <td>0.000000</td>
      <td>0.000000</td>
      <td>0.000000</td>
    </tr>
  </tbody>
</table>
</div>

## Conclusion

Search is a very important part of any application. We have seen how we can combine BM25 and semantic search to find relevant documents. In just a couple of labs, we are able to build a hybrid search engine. Now avenues are open for us to implement this search in our applications, whether they are relevant to this course or not.

In the real world, search systems rarely rely on one method alone. E‑commerce platforms like Amazon, travel booking sites, or even academic search engines use hybrid approaches to balance precision and recall. For instance, if you search 'cheap flights to NYC', the system must know that 'NYC' and 'New York' are the same, while still respecting the exactness of 'cheap flights'. Our small demo shows the essence of how large-scale search engines combine techniques to deliver both accuracy and relevance.

## Exercise

Its a good example, but its quite basic. Now make it more advanced. Some directions are:

- Adding more documents (through MongoDB), preferably PDFs.
- Scraping more data from the internet.
- Adding more features to the embedding vectors (e.g. geolocation, etc.)
- Write some unit cases to test your code.
- Try to re-implement BM25 by yourself.
- Explore hybrid search tuning: experiment with different values of $\alpha$ (e.g., 0.2, 0.5, 0.8) and observe how rankings shift between keyword-heavy and semantic-heavy results.

---

## Teaser - ElasticSearch

While we hand‑coded BM25 and hybrid search here, in production systems we often use **ElasticSearch** or **OpenSearch**. They come with:

- Built‑in BM25 scoring (default for text search).
- Support for vector search (via dense vector fields).
- Ability to do **hybrid queries** combining keyword and vector search.

Example ElasticSearch query (hybrid style):

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text": "cheap flights to New York" } }
      ],
      "should": [
        {
          "script_score": {
            "query": { "match_all": {} },
            "script": {
              "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
              "params": { "query_vector": [/* embedding of query */] }
            }
          }
        }
      ]
    }
  }
}
```

This way ElasticSearch computes BM25 relevance **and** semantic similarity, and lets you weight them as you prefer. It’s essentially the production‑grade version of the lab we built.
