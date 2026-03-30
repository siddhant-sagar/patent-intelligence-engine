import asyncio
from langgraph.graph import StateGraph, END
from models import PatentState
from agents.agent1_ingestion import run_agent1
from agents.agent2_decomposition import run_agent2
from agents.agent3_analogy import run_agent3
from agents.agent4_knowledge_graph import run_agent4
from agents.agent5_evaluation import run_agent5


def create_pipeline(callback):
    """Create a LangGraph pipeline with 5 sequential agent nodes."""

    async def node_agent1(state: PatentState) -> PatentState:
        return await run_agent1(state, callback)

    async def node_agent2(state: PatentState) -> PatentState:
        return await run_agent2(state, callback)

    async def node_agent3(state: PatentState) -> PatentState:
        return await run_agent3(state, callback)

    async def node_agent4(state: PatentState) -> PatentState:
        return await run_agent4(state, callback)

    async def node_agent5(state: PatentState) -> PatentState:
        return await run_agent5(state, callback)

    graph = StateGraph(PatentState)
    graph.add_node("ingestion", node_agent1)
    graph.add_node("decomposition", node_agent2)
    graph.add_node("analogy", node_agent3)
    graph.add_node("knowledge_graph", node_agent4)
    graph.add_node("evaluation", node_agent5)

    graph.set_entry_point("ingestion")
    graph.add_edge("ingestion", "decomposition")
    graph.add_edge("decomposition", "analogy")
    graph.add_edge("analogy", "knowledge_graph")
    graph.add_edge("knowledge_graph", "evaluation")
    graph.add_edge("evaluation", END)

    return graph.compile()


async def run_pipeline(initial_state: PatentState, queue: asyncio.Queue) -> dict:
    """Run the full pipeline, streaming events into the queue."""

    async def callback(agent: str, status: str, message: str, data):
        event = {
            "agent": agent,
            "status": status,
            "message": message,
            "data": data
        }
        await queue.put(event)

    pipeline = create_pipeline(callback)

    try:
        final_state = await pipeline.ainvoke(initial_state)
        await queue.put({
            "agent": "system",
            "status": "complete",
            "message": "Pipeline complete",
            "data": {
                "patent_metadata": final_state.get("patent_metadata"),
                "modules": final_state.get("modules"),
                "graph_data": final_state.get("graph_data"),
                "opportunities": final_state.get("opportunities"),
                "scores": final_state.get("scores"),
                "summary_brief": final_state.get("summary_brief")
            }
        })
    except Exception as e:
        await queue.put({
            "agent": "system",
            "status": "error",
            "message": str(e),
            "data": None
        })

    await queue.put(None)  # Sentinel to close connection
    return final_state
