import fitz  # PyMuPDF
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import json


def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text[:50000]  # Cap at 50k chars to stay within token limits


def extract_text_from_url(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; PatentBot/1.0)"}
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, "html.parser")
    # Remove scripts and styles
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    return text[:50000]


async def run_agent1(state: dict, callback) -> dict:
    await callback("agent1", "running", "Starting patent ingestion pipeline...", None)

    # Extract raw text
    if state["input_type"] == "pdf":
        await callback("agent1", "running", "Parsing PDF document with PyMuPDF...", None)
        try:
            raw_text = extract_text_from_pdf(state["raw_input"])
        except Exception as e:
            raise RuntimeError(f"Failed to parse PDF: {str(e)}")
    else:
        await callback("agent1", "running", "Fetching patent page from Google Patents...", None)
        try:
            raw_text = extract_text_from_url(state["raw_input"])
        except Exception as e:
            raise RuntimeError(f"Failed to fetch URL: {str(e)}")

    if not raw_text or len(raw_text) < 100:
        raise RuntimeError("Could not extract meaningful text from the provided source.")

    await callback(
        "agent1", "running",
        f"Successfully extracted {len(raw_text):,} characters. Sending to Gemini 2.0 Flash for structured metadata extraction...",
        None
    )

    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={"response_mime_type": "application/json"}
    )

    prompt = f"""You are an expert patent analyst. Analyze this patent text and extract structured information.

Return a JSON object with exactly these fields:
{{
  "title": "full patent title",
  "filing_date": "date string or 'Unknown'",
  "inventors": ["inventor1", "inventor2"],
  "assignee": "company or individual name",
  "abstract": "2-3 sentence abstract",
  "key_claims": ["claim 1 in plain English", "claim 2", "claim 3", "claim 4", "claim 5"],
  "technical_domain": "primary industry/domain (e.g. Automotive, Medical Devices, Robotics)",
  "plain_english_summary": "3-4 sentence explanation a business executive could understand, focusing on what problem it solves and how"
}}

Patent text:
{raw_text[:30000]}"""

    response = model.generate_content(prompt)
    metadata = json.loads(response.text)

    await callback(
        "agent1", "done",
        f"Ingestion complete. Patent identified: \"{metadata.get('title', 'Unknown')}\" "
        f"in domain: {metadata.get('technical_domain', 'Unknown')} "
        f"by {metadata.get('assignee', 'Unknown')}.",
        metadata
    )

    return {**state, "raw_text": raw_text, "patent_metadata": metadata}
