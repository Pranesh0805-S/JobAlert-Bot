import re
from typing import Optional

import spacy
from fastapi import FastAPI
from pydantic import BaseModel
from fastembed import TextEmbedding

app = FastAPI(title="JobAlert NLP Service")

# Disable unused spaCy pipeline components to save memory/startup time
nlp = spacy.load("en_core_web_sm", disable=["lemmatizer", "tagger", "attribute_ruler"])

# fastembed uses ONNX runtime under the hood - far lighter than torch-based sentence-transformers
embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")


class ExtractRequest(BaseModel):
    text: str


class ExtractResponse(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    application_link: Optional[str] = None
    deadline: Optional[str] = None
    embedding: list[float]
    raw_text: str


STOP_LABELS = r"(?:Location|Package|Salary|Eligibility|Apply|Last date|Deadline|Company|Role|Position)\s*:"


def extract_link(text: str) -> Optional[str]:
    match = re.search(r"https?://\S+", text)
    return match.group(0).rstrip(".,)") if match else None


def extract_salary(text: str) -> Optional[str]:
    patterns = [
        r"₹\s?[\d,.]+\s?(LPA|lpa|per annum|/year|/month)?",
        r"[\d.]+\s?LPA",
        r"\$\s?[\d,]+\s?-?\s?\$?\s?[\d,]*",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return None


def extract_deadline(text: str) -> Optional[str]:
    patterns = [
        r"\d{1,2}[\/\-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[\/\-\s]\d{2,4}",
        r"\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0)
    return None


ROLE_KEYWORDS = [
    "developer", "engineer", "intern", "internship", "analyst",
    "associate", "manager", "designer", "consultant", "trainee",
    "architect", "specialist", "lead"
]


def extract_role(text: str, doc) -> Optional[str]:
    match = re.search(
        rf"(?:role|position|title)\s*[:\-]\s*(.+?)(?=\.|{STOP_LABELS}|$)",
        text, re.IGNORECASE
    )
    if match:
        return match.group(1).strip(" .")

    match = re.search(
        r"hiring\s+(?:freshers?\s+)?(?:for\s+the\s+role\s+of\s+)?([A-Z][a-zA-Z\s]{2,40}?)(?=\.|,|\s+Location|\s+Package)",
        text
    )
    if match:
        return match.group(1).strip()

    for sent in doc.sents:
        lower = sent.text.lower()
        if any(keyword in lower for keyword in ROLE_KEYWORDS):
            for chunk in sent.noun_chunks:
                if any(keyword in chunk.text.lower() for keyword in ROLE_KEYWORDS):
                    return chunk.text.strip()
    return None


def extract_company(text: str, doc) -> Optional[str]:
    match = re.search(
        rf"(?:company|organisation|organization)\s*[:\-]\s*(.+?)(?=\.|{STOP_LABELS}|$)",
        text, re.IGNORECASE
    )
    if match:
        return match.group(1).strip(" .")

    orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
    if orgs:
        return orgs[0]
    return None


def extract_location(text: str, doc) -> Optional[str]:
    match = re.search(
        rf"(?:location|based in|place)\s*[:\-]\s*(.+?)(?=\.|{STOP_LABELS}|$)",
        text, re.IGNORECASE
    )
    if match:
        result = match.group(1).strip(" .")
        if len(result) < 100:
            return result

    locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
    if locations:
        return ", ".join(dict.fromkeys(locations))
    return None


@app.post("/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest):
    text = request.text
    doc = nlp(text)

    company = extract_company(text, doc)
    role = extract_role(text, doc)
    location = extract_location(text, doc)
    salary = extract_salary(text)
    application_link = extract_link(text)
    deadline = extract_deadline(text)

    # fastembed returns a generator; take the first (only) result
    embedding = list(embedder.embed([text]))[0].tolist()

    return ExtractResponse(
        company=company,
        role=role,
        location=location,
        salary=salary,
        application_link=application_link,
        deadline=deadline,
        embedding=embedding,
        raw_text=text,
    )


@app.get("/health")
def health():
    return {"status": "ok"}