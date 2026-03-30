from pydantic import BaseModel
from typing import Any, Optional
from typing_extensions import TypedDict


class PatentMetadata(BaseModel):
    title: str
    filing_date: str
    inventors: list[str]
    assignee: str
    abstract: str
    key_claims: list[str]
    technical_domain: str
    plain_english_summary: str


class TechnologyModule(BaseModel):
    module_name: str
    category: str  # sensor|algorithm|mechanism|actuator|data_processing|control_system|other
    description: str
    function: str
    generic_equivalent: str


class Analogy(BaseModel):
    module_name: str
    domain: str
    use_case: str
    analogy_explanation: str
    similarity_score: int
    implementation_path: str


class Opportunity(BaseModel):
    domain: str
    use_case: str
    analogy_explanation: str
    supporting_modules: list[str]
    composite_score: float
    novelty: float
    modularity: float
    transferability: float
    feasibility: float
    market_potential: float
    action_recommendation: str
    strategy_brief: str


class GraphNode(BaseModel):
    id: str
    type: str  # patent|module|domain|application
    label: str
    description: str
    score: Optional[float] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class PatentState(TypedDict):
    job_id: str
    input_type: str           # "pdf" or "url"
    raw_input: str            # file path or URL
    raw_text: str
    patent_metadata: dict
    modules: list[dict]
    analogies: list[dict]
    graph_data: dict
    opportunities: list[dict]
    scores: dict
    summary_brief: str
    error: Optional[str]
    streaming_callback: Any


class AnalyzeRequest(BaseModel):
    patent_url: Optional[str] = None


class JobStatus(BaseModel):
    job_id: str
    status: str
    results: Optional[dict] = None
