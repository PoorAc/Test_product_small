from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

class SummarizeRequest(BaseModel):
    text: str

# Load once at container startup
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device=-1  # CPU (safe default)
)

@app.post("/summarize")
def summarize(req: SummarizeRequest):
    result = summarizer(
        req.text,
        max_length=150,
        min_length=40,
        do_sample=False,
    )
    return {"summary": result[0]["summary_text"]}
