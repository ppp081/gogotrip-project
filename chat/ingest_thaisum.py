# chat/ingest_thaisum.py
import pandas as pd
from langchain.schema import Document
from langchain.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
import os

# โหลด dataset จากไฟล์ในเครื่อง
def load_thaisum_dataframe():
    df = pd.read_csv("chat/thaisum_test.csv", encoding="utf-8")
    return df

# แปลงข้อมูลให้เป็น LangChain Documents
def convert_to_documents(df):
    documents = []
    for i, row in df.iterrows():
        content = str(row.get("body", ""))
        metadata = {
            "title": str(row.get("title", "")),
            "summary": str(row.get("summary", "")),
        }
        doc = Document(page_content=content, metadata=metadata)
        documents.append(doc)
    return documents

# สร้าง Vector Store
def create_vector_store(documents):
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(documents, embeddings)
    vectorstore.save_local("faiss_thaisum_index")
    print("✅ Vector store saved to 'faiss_thaisum_index'")

# Main pipeline
def ingest_thaisum():
    df = load_thaisum_dataframe()
    documents = convert_to_documents(df)
    create_vector_store(documents)

if __name__ == "__main__":
    ingest_thaisum()

