Vector databases are a world of its own. And for a course like this, its hard for us to do the real justice with this (and many other) topic by covering its depth. 
However, last year I wrote some detailed blogs on the topic and would like to share them with you.

The vector database pipeline is something like:

- Raw data (Text, image or other)
- Embeddings Generation
- Embeddings Storage (in vector db)
- Query Embedding
- Vector Search
- Ranking
- Using the results
- Feedback, Re-ranking, etc (optional)

The blog posts (ordered by pipeline) are:

## Contrastive Learning

Contrastive learning is a technique that allows us to learn embeddings from unlabeled data.
It is useful for you if you want to build an embedding model for your own data. 

Remember that embedding models are trained on a large general dataset and are not specific to your data, so fine-tuning them on your data will help you improve results, especially when you are working on some client's project.

I wrote [this article](https://www.myscale.com/blog/what-is-contrastive-learning/#simclr) on the topic a year ago.

If you are curious to read more about it, I wrote another article on the [Triplet Loss](https://www.myscale.com/blog/what-is-triplet-loss/).

## Using Different Embedding Models

Similarly, I wrote another article in detail on how to use different embedding models, from Hugging Face, OpenAI, BedRock etc and save them in the vector database.
You can also find some code examples in the [blog post](https://www.myscale.com/blog/working-with-embedding-models-using-myscale/).

