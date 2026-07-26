import re
from typing import Optional

import spacy
from fastapi import FastAPI
from pydantic import BaseModel
from fastembed import TextEmbedding

app = FastAPI(title="JobAlert NLP Service")

nlp = spacy.load("en_core_web_sm", disable=["lemmatizer", "tagger", "attribute_ruler"])
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


def clean_value(text: str) -> str:
    # strip leading emoji/symbol clutter and surrounding whitespace/punctuation
    text = re.sub(r'^[^\w(]+', '', text)
    return text.strip(" .-–—\t")


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
    # Only match a date if it's near a deadline-indicating keyword, so we don't
    # mistake a "posted on" date for an application deadline.
    date_pattern = (
        r"(\d{1,2}[\/\-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[\/\-\s]\d{2,4}"
        r"|\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|"
        r"September|October|November|December)\s+\d{4})"
    )
    keyword_pattern = rf"(?:last date|apply by|deadline|closing date|apply before)[^\n]*?{date_pattern}"
    match = re.search(keyword_pattern, text, re.IGNORECASE)
    if match:
        return match.group(1)
    return None


def extract_labelled_field(text: str, labels: list[str]) -> Optional[str]:
    """Match a 'Label: value' pattern, capturing only up to the end of that line."""
    label_alt = "|".join(labels)
    pattern = rf"(?:{label_alt})\s*[:\-]\s*([^\n]+)"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return clean_value(match.group(1))
    return None


def extract_company_from_heading(text: str) -> Optional[str]:
    """Catches common heading styles like 'Capgemini Mass Hiring 2026' or
    'Accenture is Hiring Freshers!' when there's no explicit Company: label."""
    patterns = [
        r"([A-Z][A-Za-z0-9&.\s]{1,40}?)\s+(?:is\s+)?(?:Mass\s+)?Hiring",
        r"([A-Z][A-Za-z0-9&.\s]{1,40}?)\s+is\s+hiring",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            candidate = clean_value(match.group(1))
            # avoid picking up junk like emoji-only fragments
            if len(candidate) > 1 and any(c.isalpha() for c in candidate):
                return candidate
    return None


ROLE_KEYWORDS = [
    "developer", "engineer", "intern", "internship", "analyst",
    "associate", "manager", "designer", "consultant", "trainee",
    "architect", "specialist", "lead"
]


def extract_role(text: str, doc) -> Optional[str]:
    labelled = extract_labelled_field(text, ["role", "position", "title"])
    if labelled:
        return labelled

    match = re.search(
        r"hiring\s+(?:freshers?\s+)?(?:for\s+the\s+role\s+of\s+)?([A-Z][a-zA-Z\s]{2,40}?)(?=\.|,|\n|$)",
        text
    )
    if match:
        return clean_value(match.group(1))

    for sent in doc.sents:
        lower = sent.text.lower()
        if any(keyword in lower for keyword in ROLE_KEYWORDS):
            for chunk in sent.noun_chunks:
                if any(keyword in chunk.text.lower() for keyword in ROLE_KEYWORDS):
                    return clean_value(chunk.text)
    return None


def extract_company(text: str, doc) -> Optional[str]:
    labelled = extract_labelled_field(text, ["company", "organisation", "organization"])
    if labelled:
        return labelled

    heading = extract_company_from_heading(text)
    if heading:
        return heading

    orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
    if orgs:
        return orgs[0]
    return None


def extract_location(text: str, doc) -> Optional[str]:
    labelled = extract_labelled_field(text, ["location", "based in", "place"])
    if labelled and len(labelled) < 100:
        return labelled

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