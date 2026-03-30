import google.generativeai as genai
import json
from collections import defaultdict


async def run_agent5(state: dict, callback) -> dict:
    await callback("agent5", "running", "Beginning strategic opportunity evaluation and multi-dimensional scoring...", None)

    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={"response_mime_type": "application/json"}
    )

    # Group analogies by domain
    domain_data: dict[str, dict] = defaultdict(lambda: {"analogies": [], "modules": []})
    for analogy in state["analogies"]:
        domain_data[analogy["domain"]]["analogies"].append(analogy)
        domain_data[analogy["domain"]]["modules"].append(analogy["module_name"])

    total_modules = max(len(state["modules"]), 1)
    opportunities = []

    await callback(
        "agent5", "running",
        f"Evaluating {len(domain_data)} candidate domains across 5 strategic dimensions: "
        f"Novelty, Modularity, Transferability, Feasibility, Market Potential...",
        None
    )

    for domain, data in list(domain_data.items())[:6]:  # Top 6 domains max
        analogies = data["analogies"]
        supporting_modules = list(set(data["modules"]))

        # Compute quantitative signals
        transferability = sum(a["similarity_score"] for a in analogies) / len(analogies)
        modularity = (len(supporting_modules) / total_modules) * 100

        await callback(
            "agent5", "running",
            f"Scoring domain \"{domain}\" — "
            f"raw transferability: {transferability:.0f}/100, "
            f"module coverage: {modularity:.0f}% ({len(supporting_modules)}/{total_modules} modules)...",
            None
        )

        # Ask Gemini for qualitative scores
        eval_prompt = f"""You are a technology commercialization strategist evaluating an IP licensing opportunity.

Patent: {state['patent_metadata'].get('title', 'Unknown')}
Original domain: {state['patent_metadata'].get('technical_domain', 'Unknown')}
Target domain: {domain}

Supporting use cases from patent modules:
{json.dumps([{
    'use_case': a['use_case'],
    'explanation': a['analogy_explanation'],
    'implementation_path': a['implementation_path']
} for a in analogies], indent=2)}

Evaluate this cross-domain opportunity and return JSON:
{{
  "novelty": <0-100: how unique/non-obvious is this cross-domain application compared to existing solutions>,
  "feasibility": <0-100: technical and regulatory feasibility of implementation in the next 2-3 years>,
  "market_potential": <0-100: size and growth trajectory of the addressable market in this domain>,
  "action_recommendation": "single most impactful first action the patent owner should take — specific and actionable (1 sentence)",
  "strategy_brief": "3-sentence executive summary: what the opportunity is, why it is strategically valuable now, and what measurable outcome to expect"
}}

Be precise. Scores should reflect real market conditions, not optimism. Consider regulatory barriers, existing competition, and time-to-market."""

        eval_response = model.generate_content(eval_prompt)
        eval_data = json.loads(eval_response.text)

        composite_score = (
            eval_data.get("novelty", 70) * 0.20 +
            modularity * 0.20 +
            transferability * 0.25 +
            eval_data.get("feasibility", 70) * 0.20 +
            eval_data.get("market_potential", 70) * 0.15
        )

        best_analogy = max(analogies, key=lambda a: a["similarity_score"])

        opportunities.append({
            "domain": domain,
            "use_case": best_analogy["use_case"],
            "analogy_explanation": best_analogy["analogy_explanation"],
            "supporting_modules": supporting_modules,
            "composite_score": round(composite_score, 1),
            "novelty": round(eval_data.get("novelty", 70), 1),
            "modularity": round(modularity, 1),
            "transferability": round(transferability, 1),
            "feasibility": round(eval_data.get("feasibility", 70), 1),
            "market_potential": round(eval_data.get("market_potential", 70), 1),
            "action_recommendation": eval_data.get("action_recommendation", ""),
            "strategy_brief": eval_data.get("strategy_brief", "")
        })

    # Sort by composite score
    opportunities.sort(key=lambda x: x["composite_score"], reverse=True)
    top_3 = opportunities[:3]

    # Generate overall summary brief
    await callback("agent5", "running", "All domains scored. Generating executive strategy brief for Chief IP Officer...", None)

    brief_prompt = f"""Write a 4-sentence executive summary for a Chief IP Officer at {state['patent_metadata'].get('assignee', 'this organization')}.

Patent analyzed: {state['patent_metadata'].get('title', 'Unknown')}
Top cross-industry opportunities identified: {', '.join([o['domain'] for o in top_3])}
Highest-scoring opportunity: {top_3[0]['domain'] if top_3 else 'N/A'} (composite score: {top_3[0]['composite_score'] if top_3 else 0}/100)

Return JSON: {{"summary_brief": "your 4-sentence brief here"}}

The brief should:
1. State what latent commercial value was discovered in this patent
2. Name the top opportunity and why it is strategically important right now
3. Quantify or characterize the market opportunity
4. Recommend the single most impactful next step"""

    brief_response = model.generate_content(brief_prompt)
    brief_data = json.loads(brief_response.text)
    summary_brief = brief_data.get("summary_brief", "")

    scores = {
        "total_opportunities": len(opportunities),
        "avg_composite_score": round(
            sum(o["composite_score"] for o in opportunities) / max(len(opportunities), 1), 1
        ),
        "top_domain": top_3[0]["domain"] if top_3 else "",
        "top_score": top_3[0]["composite_score"] if top_3 else 0
    }

    await callback(
        "agent5", "done",
        f"Evaluation complete. Top opportunity: \"{scores['top_domain']}\" with {scores['top_score']:.1f}/100 composite score. "
        f"{len(opportunities)} total opportunities ranked. Executive brief generated.",
        {"scores": scores, "top_opportunity": top_3[0] if top_3 else None}
    )

    return {**state, "opportunities": top_3, "scores": scores, "summary_brief": summary_brief}
