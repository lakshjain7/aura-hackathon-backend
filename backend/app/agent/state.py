from typing import TypedDict, Annotated, Optional, List
import operator

class AgentState(TypedDict):
    """
    Core state for the AURA LangGraph orchestrator.
    Tracks a grievance from ingestion to resolution.
    """
    # Multimodal Input
    original_text: str
    translated_text: Optional[str]
    image_url: Optional[str]
    audio_url: Optional[str]
    source: str # "whatsapp", "discord"

    sender_id: str
    
    # Security Supervisor Check
    is_safe: bool
    rejection_reason: Optional[str]
    
    # Priority Logic Agent
    category: Optional[str]
    severity: Optional[str] # "Low", "Medium", "High", "Critical"
    confidence_score: Optional[float]
    sentiment_score: Optional[float] # -1.0 to 1.0 (TextBlob)
    historical_count: Optional[int] # Complaints in this pincode last 30d
    needs_human_review: Optional[bool] # Triggered if confidence < 0.8

    
    # Routing & SLA
    department: Optional[str]
    pincode: Optional[str]
    geography: Optional[dict] # {"lat": float, "lng": float}
    sla_deadline: Optional[str] # ISO format datetime
    
    # Clustering (Systemic Auditor)
    cluster_id: Optional[str]
    is_duplicate: Optional[bool]
    missing_info: Optional[bool]

    
    # Resolution (Dual-Key Handshake)
    officer_resolution_status: bool
    citizen_confirmation_status: bool
    
    # Audit log (append list)
    history: Annotated[List[str], operator.add]
