import os
import dotenv
dotenv.load_dotenv(override=True)
from langchain_openai import ChatOpenAI

os.environ["OPENAI_API_KEY"] = ""

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="google/gemma-3-27b-it:free",
    temperature=0.6,
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "TripBot"
    }
)
try:
    print("Call model...")
    print(llm.invoke("Hi"))
except Exception as e:
    print("Error:", e)
