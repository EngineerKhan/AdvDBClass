_(Added: 26 Sep)_

_(Last updated: 26 Sep)_

In the next week, we will do some further work on vector db. Apart from the theory, our agenda for the next week (also) includes:

- Projects Discussion
- Implementing reverse image search using embeddings and vector db


## Lab Task – Week 5

Next week, we will implement reverse image search using embeddings and vector db. 
While the exact task will be discussed in the lab, we will discuss the general idea of the task today.

- We can calculate embeddings of images too the way we calculate them for text.
- Transformers are used for text, but we also have Vision Transformers (ViTs) which use the attention mechanism for images.
- We can use the image embeddings to search for similar images.

### TODO

- Pick some suitable HuggingFace ViT model and play around with it.
- Pick some suitable image dataset from HuggingFace like [this one](https://huggingface.co/datasets/huggan/wikiart).

> **Caution:** Instead of downloading the whole file (5+GB), use the [API](https://datasets-server.huggingface.co/rows?dataset=huggan%2Fwikiart&config=default&split=train&offset=0&length=100). You can use chatGPT here to write a script to download the images.

- Try to perform the search using the similarity search we performed with text this week.

