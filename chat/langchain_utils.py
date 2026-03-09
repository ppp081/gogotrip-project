import pandas as pd
from langchain.schema import Document
df = pd.read_csv("thaisum.csv")  # หรือ path ของคุณ

# สร้าง Document objects
documents = [
    Document(page_content=row["body"], metadata={"summary": row["summary"]})
    for _, row in df.iterrows()
]