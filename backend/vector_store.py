import chromadb
import google.generativeai as genai


class VectorStore:
    def __init__(self):
        # Use in-memory client — no disk needed, perfect for free tier
        self.client = chromadb.Client()
        self.collections = {}

    def get_or_create_collection(self, job_id: str):
        name = f"patent_{job_id}"
        if name not in self.collections:
            self.collections[name] = self.client.create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
        return self.collections[name]

    def get_embedding(self, text: str) -> list[float]:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']

    def add_modules(self, job_id: str, modules: list[dict]):
        collection = self.get_or_create_collection(job_id)
        for i, module in enumerate(modules):
            text = f"{module['module_name']}: {module['description']} {module['function']}"
            embedding = self.get_embedding(text)
            collection.add(
                ids=[f"module_{i}"],
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "module_name": module["module_name"],
                    "category": module["category"]
                }]
            )

    def query_similar(self, job_id: str, query: str, n_results: int = 3) -> list[dict]:
        collection = self.get_or_create_collection(job_id)
        embedding = self.get_embedding(query)
        results = collection.query(
            query_embeddings=[embedding],
            n_results=n_results
        )
        return results

    def cleanup(self, job_id: str):
        name = f"patent_{job_id}"
        if name in self.collections:
            self.client.delete_collection(name)
            del self.collections[name]


vector_store = VectorStore()
