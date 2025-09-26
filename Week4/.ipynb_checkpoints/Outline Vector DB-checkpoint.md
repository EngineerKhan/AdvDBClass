## Embeddings 101 (Conceptual)
- **What is an embedding?** A dense float vector capturing meaning. [Add: 1–2 sentences + examples (1536‑dim, 768‑dim).]
- **How they’re produced:** From models (OpenAI, SBERT, E5, CLIP). [Add: when to keep model & vector dims consistent.]
- **Normalization:** When/why to L2‑normalize (esp. cosine). [Add: quick rule of thumb.]

---
## 3. Similarity & Distance Metrics
- **Cosine vs. dot vs. L2:** Trade‑offs, when to pick each. [Add: 1‑line guidance per metric.]
- **Score interpretation:** Lower/upper is better depending on metric. [Add: note on re‑scaling to relevance.]

---
## 4. Exact vs. Approximate NN
- **Brute force (exact):** O(N·d) cost; fine for ≤100k. [Add: where CPU SIMD helps.]
- **ANN:** Sacrifice tiny accuracy for massive speed. [Add: definition of recall@k.]

---
## 5. ANN Index Families (High‑Level Theory)
- **HNSW (graph‑based):** Fast queries, higher RAM. [Add: M, efConstruction, efSearch intuition.]
- **IVF / IVF+PQ:** Cluster then search relevant lists; good on disk. [Add: nlist, nprobe, PQ codebook intuition.]
- **DiskANN / SSD‑optimized:** For billion‑scale with limited RAM. [Add: when to consider.]

---
## 6. Data & Storage Model in Vector DBs
- **Vector + metadata (payload):** Store attributes with the vector. [Add: examples: title, tags, lang, timestamp.]
- **Schema tips:** Stable IDs, versioned embeddings, partitions/collections. [Add: mutation strategy when model changes.]

---
## 7. Query Patterns (Theory of Use)
- **kNN search:** Retrieve top‑k similar items. [Add: explain top‑k & score.]
- **Filtered vector search:** Apply metadata predicates with ANN. [Add: time, language, type filters.]
- **Hybrid search (BM25 + vector):** Combine lexical + semantic. [Add: when hybrid beats either alone.]
- **Reranking:** Small LLM/reranker improves final order. [Add: latency trade‑off.]

---
## 8. Consistency, Freshness & Updates
- **Eventual vs. near‑real‑time:** ANN index build/merge cycles. [Add: ingest vs. query isolation notes.]
- **Upserts & deletes:** Tombstones, background compaction. [Add: pitfalls with hot partitions.]

---
## 9. Scaling & Sharding Theory
- **Horizontal scale:** Partition by collection/tenant or hash on ID. [Add: trade‑offs for recall/latency.]
- **Hot vs. cold tiers:** Memory for HNSW graph, SSD for vectors. [Add: tiering strategies.]

---
## 10. Performance Tuning (Conceptual)
- **Recall/latency knobs:** efSearch (HNSW), nprobe (IVF). [Add: cookbook defaults + when to raise.]
- **Batching & concurrency:** Amortize embedding + network costs. [Add: p95/p99 monitoring targets.]
- **Dimensionality & precision:** Lower dims, FP16/INT8 PQ trade‑offs. [Add: guidance to keep dim consistent.]

---
## 11. Cost & Capacity Planning
- **RAM math:** Rough bytes = dim × 4 × N (+ index overhead). [Add: quick sizing example.]
- **Storage math:** Vectors + metadata + index; backups/snapshots. [Add: cost model bullets (SaaS vs self‑host).]

---
## 12. Observability & Quality (Theory)
- **KPIs:** recall@k, MRR/nDCG, latency p95/p99, QPS. [Add: definitions one‑liners.]
- **Offline eval:** Golden queries, A/B testing, drift checks. [Add: dataset curation tips.]

---
## 13. Security & Multi‑Tenancy
- **Isolation:** Per‑tenant collections/filters; RLS‑like patterns. [Add: token‑scoped namespaces.]
- **PII & compliance:** Hashing, encryption at rest, retention. [Add: audit logging notes.]

---
## 14. Offline Ingest Pipeline (Theory)
- **Chunking strategy:** Size, overlap, per‑type (text/code). [Add: heuristics to minimize hallucinations.]
- **Embedding jobs:** Idempotent, versioned, resumable. [Add: re‑embed strategy on model upgrade.]

---
## 15. RAG Architecture (Conceptual Map)
- **Retrieval → Rerank → Generate:** 3‑stage mental model. [Add: where filters & hybrid fit.]
- **Context packing:** Token budget, dedupe, citations. [Add: guardrails for freshness.]

---
## 16. Beyond RAG: Other Theory Use‑Cases
- **Recommendations:** User/item embeddings, ANN join. [Add: cold‑start note.]
- **Anomaly detection:** Distance to centroid/neighborhood. [Add: thresholding intuition.]
- **Clustering & topic maps:** k‑means, HDBSCAN on vectors. [Add: when to precompute.]

---
## 17. When *Not* to Use a Vector DB
- **Structured lookups/OLTP:** Keys, joins, transactions dominate. [Add: use RDBMS/Mongo.]
- **Tiny datasets:** Brute force is simpler/cheaper. [Add: guidance ≤100k vectors.]

---
## 18. Platform Landscape (Conceptual Comparison)
- **Self‑host:** Qdrant, Milvus, Weaviate, Vespa. [Add: one‑line strengths.]
- **Managed/SaaS:** Pinecone, Elastic, Cloud providers. [Add: scaling + cost posture.]
- **Add‑ons:** Postgres + pgvector, Mongo Atlas Vector, Redis. [Add: when good enough.]

---
## 19. Cheat‑Sheet (Theory Nuggets)
- **Metric choice:** Cosine for normalized text; dot for unnormalized; L2 for continuous signals. [Add: 1‑liners.]
- **Index choice:** HNSW for RAM speed; IVF+PQ for scale/cost. [Add: defaults to start with.]
- **Hybrid rule:** BM25 for precision, vectors for recall → fuse. [Add: simple scoring fusion tip.]

---
## 20. Exercise Ideas (Theory‑leaning)
- **Paper search:** Compare BM25 vs vector vs hybrid on short queries. [Add: expected outcome notes.]
- **Recall tuning:** Show recall‑latency curve by changing efSearch/nprobe. [Add: plotting instruction.]
- **Drift demo:** Re‑embed after model change; measure differences. [Add: what to look for.]

---
## 21. Glossary
- **Embedding, ANN, HNSW, IVF, PQ, recall@k, rerank, hybrid search.** [Add: crisp 1‑line definitions.]

---
## 22. References & Further Reading
- **Academic & docs:** Add canonical papers (HNSW, IVF/PQ), vendor whitepapers, and neutral benchmarks. [Add: 6–10 links with a note each.]