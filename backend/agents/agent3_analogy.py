import google.generativeai as genai
import json


async def run_agent3(state: dict, callback) -> dict:
    await callback("agent3", "running", "Initiating cross-domain analogy reasoning engine...", None)

    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={"response_mime_type": "application/json"}
    )

    all_analogies = []
    modules = state["modules"]
    technical_domain = state["patent_metadata"].get("technical_domain", "Unknown")

    await callback(
        "agent3", "running",
        f"Scanning {len(modules)} technology modules for cross-industry transfer potential outside of {technical_domain}...",
        None
    )

    for i, module in enumerate(modules):
        await callback(
            "agent3", "running",
            f"Reasoning about module {i + 1}/{len(modules)}: \"{module['module_name']}\" "
            f"(category: {module['category']}) — identifying highest-value analogous industries...",
            None
        )

        prompt = f"""You are a cross-industry innovation strategist with deep knowledge of technology transfer and IP licensing.

Given this technology module from the {technical_domain} industry, identify the top 3 industries OUTSIDE of {technical_domain} that could benefit from this same underlying capability.

Module name: {module['module_name']}
Category: {module['category']}
Description: {module['description']}
Function: {module['function']}
Generic form: {module['generic_equivalent']}

Return a JSON object with key "analogies" containing exactly 3 items:
{{
  "analogies": [
    {{
      "domain": "target industry name (specific, e.g. 'Precision Agriculture' not just 'Agriculture')",
      "use_case": "specific application title (5-8 words)",
      "analogy_explanation": "explain WHY this module is directly applicable here — what shared underlying problem exists (2-3 sentences)",
      "similarity_score": <integer 50-99 reflecting how strongly this module maps to this domain>,
      "implementation_path": "concrete first step to implement this in the target domain (1-2 sentences)"
    }}
  ]
}}

Be specific and commercially realistic. Avoid generic answers.
Prioritize domains where this specific capability creates genuine competitive advantage or solves an expensive problem."""

        response = model.generate_content(prompt)
        result = json.loads(response.text)
        analogies = result.get("analogies", [])

        for analogy in analogies:
            analogy["module_name"] = module["module_name"]
            all_analogies.append(analogy)

    # Deduplicate and rank domains
    domain_scores: dict[str, list[int]] = {}
    for analogy in all_analogies:
        domain = analogy["domain"]
        if domain not in domain_scores:
            domain_scores[domain] = []
        domain_scores[domain].append(analogy["similarity_score"])

    top_domains = sorted(
        domain_scores.items(),
        key=lambda x: sum(x[1]) / len(x[1]),
        reverse=True
    )[:5]
    top_domain_names = [d[0] for d in top_domains]

    await callback(
        "agent3", "done",
        f"Cross-domain analogy mapping complete. {len(all_analogies)} analogies found across "
        f"{len(domain_scores)} domains. Top 5 opportunity domains: {', '.join(top_domain_names)}",
        {"analogies": all_analogies, "top_domains": top_domain_names}
    )

    return {**state, "analogies": all_analogies}
