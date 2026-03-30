import networkx as nx
import math


async def run_agent4(state: dict, callback) -> dict:
    await callback("agent4", "running", "Constructing knowledge graph from patent analysis data...", None)

    G = nx.DiGraph()
    patent_id = "patent_root"
    title = state["patent_metadata"].get("title", "Patent")
    # Truncate title for display
    display_title = title[:45] + "..." if len(title) > 45 else title

    # Central patent node
    G.add_node(
        patent_id,
        type="patent",
        label=display_title,
        description=state["patent_metadata"].get("plain_english_summary", "")
    )

    # Module nodes
    for module in state["modules"]:
        mod_id = f"module_{module['module_name'].replace(' ', '_').lower()}"
        G.add_node(
            mod_id,
            type="module",
            label=module["module_name"],
            description=module["description"],
            category=module["category"]
        )
        G.add_edge(patent_id, mod_id, label="contains")

    await callback(
        "agent4", "running",
        f"Added patent root and {len(state['modules'])} module nodes. "
        f"Building domain and application layers from {len(state['analogies'])} cross-industry analogies...",
        None
    )

    # Domain and application nodes from analogies
    domain_nodes: dict[str, str] = {}
    for analogy in state["analogies"]:
        domain = analogy["domain"]
        dom_id = f"domain_{domain.replace(' ', '_').replace('/', '_').lower()}"

        if dom_id not in domain_nodes:
            G.add_node(
                dom_id,
                type="domain",
                label=domain,
                description=f"Cross-industry application domain for technology transfer",
                score=analogy["similarity_score"]
            )
            domain_nodes[dom_id] = domain

        mod_id = f"module_{analogy['module_name'].replace(' ', '_').lower()}"
        if G.has_node(mod_id):
            if not G.has_edge(mod_id, dom_id):
                G.add_edge(mod_id, dom_id, label="applies_to")

        # Application node
        use_case_key = analogy["use_case"].replace(" ", "_").replace("/", "_").lower()[:30]
        app_id = f"app_{use_case_key}"
        if not G.has_node(app_id):
            G.add_node(
                app_id,
                type="application",
                label=analogy["use_case"],
                description=analogy["analogy_explanation"],
                score=analogy["similarity_score"]
            )
        if not G.has_edge(dom_id, app_id):
            G.add_edge(dom_id, app_id, label="enables")

    await callback(
        "agent4", "running",
        f"Graph topology built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges. "
        f"Computing concentric ring layout for {len(domain_nodes)} domain clusters...",
        None
    )

    # Compute positions using concentric ring layout
    nodes_by_type: dict[str, list[str]] = {
        "patent": [],
        "module": [],
        "domain": [],
        "application": []
    }
    for node_id, data in G.nodes(data=True):
        ntype = data.get("type", "module")
        if ntype in nodes_by_type:
            nodes_by_type[ntype].append(node_id)

    positions: dict[str, dict[str, float]] = {}
    center_x, center_y = 400, 350
    radii = {"patent": 0, "module": 190, "domain": 370, "application": 560}

    if nodes_by_type["patent"]:
        positions[nodes_by_type["patent"][0]] = {"x": float(center_x), "y": float(center_y)}

    for ntype, radius in radii.items():
        if ntype == "patent":
            continue
        nodes = nodes_by_type[ntype]
        count = len(nodes)
        for i, node_id in enumerate(nodes):
            angle = (2 * math.pi * i / max(count, 1)) - math.pi / 2
            positions[node_id] = {
                "x": center_x + radius * math.cos(angle),
                "y": center_y + radius * math.sin(angle)
            }

    # Convert to React Flow format
    type_colors = {
        "patent": "#7C3AED",
        "module": "#9333EA",
        "domain": "#0891B2",
        "application": "#059669"
    }

    react_nodes = []
    for node_id, data in G.nodes(data=True):
        ntype = data.get("type", "module")
        pos = positions.get(node_id, {"x": 0.0, "y": 0.0})
        react_nodes.append({
            "id": node_id,
            "type": "customNode",
            "position": pos,
            "data": {
                "label": data.get("label", node_id),
                "type": ntype,
                "description": data.get("description", ""),
                "score": data.get("score"),
                "color": type_colors.get(ntype, "#6B7280"),
                "category": data.get("category", "")
            }
        })

    react_edges = []
    for i, (source, target, data) in enumerate(G.edges(data=True)):
        edge_label = data.get("label", "")
        react_edges.append({
            "id": f"edge_{i}",
            "source": source,
            "target": target,
            "label": edge_label,
            "type": "smoothstep",
            "animated": edge_label == "contains",
            "style": {"stroke": "#4B5563", "strokeWidth": 1.5}
        })

    graph_data = {"nodes": react_nodes, "edges": react_edges}

    await callback(
        "agent4", "done",
        f"Knowledge graph complete: {len(react_nodes)} nodes "
        f"({len(nodes_by_type['module'])} modules, {len(domain_nodes)} domains, "
        f"{len(nodes_by_type['application'])} applications), "
        f"{len(react_edges)} edges.",
        {"node_count": len(react_nodes), "edge_count": len(react_edges)}
    )

    return {**state, "graph_data": graph_data}
