import google.generativeai as genai
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vector_store import vector_store


async def run_agent2(state: dict, callback) -> dict:
    await callback("agent2", "running", "Beginning modular decomposition of patent technology...", None)

    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={"response_mime_type": "application/json"}
    )

    await callback(
        "agent2", "running",
        f"Analyzing patent claims and technical description for reusable building blocks...",
        None
    )

    prompt = f"""You are a technology decomposition expert. Break down this patent into its distinct functional technology modules.

Think of each module as a reusable building block that could exist independently of this specific patent's application.

Return a JSON object with key "modules" containing an array of 4-7 modules. Each module:
{{
  "module_name": "short descriptive name (3-5 words)",
  "category": "one of: sensor|algorithm|mechanism|actuator|data_processing|control_system|material|interface|other",
  "description": "what this module is (1-2 sentences)",
  "function": "what problem this module solves (1 sentence)",
  "generic_equivalent": "describe this module in completely domain-agnostic terms, as if explaining to someone from a different industry (1-2 sentences)"
}}

Patent domain: {state['patent_metadata'].get('technical_domain', 'Unknown')}
Patent summary: {state['patent_metadata'].get('plain_english_summary', '')}

Full patent text excerpt:
{state['raw_text'][:25000]}"""

    await callback("agent2", "running", "Sending patent text to Gemini 2.0 Flash for modular analysis...", None)
    response = model.generate_content(prompt)
    result = json.loads(response.text)
    modules = result.get("modules", [])

    if not modules:
        raise RuntimeError("Decomposition produced no modules. Please try a different patent.")

    await callback(
        "agent2", "running",
        f"Identified {len(modules)} technology modules. Generating semantic embeddings with text-embedding-004 and indexing in ChromaDB vector store...",
        None
    )

    # Store embeddings in ChromaDB
    try:
        vector_store.add_modules(state["job_id"], modules)
    except Exception as e:
        await callback("agent2", "running", f"Vector store indexing note: {str(e)[:100]}. Continuing without embeddings.", None)

    module_names = [m["module_name"] for m in modules]
    categories = list(set(m["category"] for m in modules))

    await callback(
        "agent2", "done",
        f"Decomposition complete. {len(modules)} modules identified across {len(categories)} categories: "
        f"{', '.join(module_names)}",
        {"modules": modules}
    )

    return {**state, "modules": modules}
