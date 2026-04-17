import uuid
from datetime import datetime, timedelta
from sqlalchemy import select

from app.agent.state import AgentState
from app.core.database import AsyncSessionLocal
from app.models.complaint import Complaint
from app.models.user import User

def map_department(category: str) -> str:
    mapping = {
        "Roads": "Public Works Dept (PWD)",
        "Water": "Water Supply Board",
        "Sanitation": "Municipal Solid Waste Management",
        "Electricity": "State Electricity Board",
        "Safety": "Local Police Department",
        "Noise": "Local Police Department"
    }
    return mapping.get(category, "General Administration")

def calculate_sla(severity: str) -> datetime:
    hours_map = {
        "Low": 72,
        "Medium": 48,
        "High": 24,
        "Critical": 4
    }
    hours = hours_map.get(severity, 48)
    return datetime.utcnow() + timedelta(hours=hours)

async def geo_routing(state: AgentState) -> AgentState:
    """
    SLA & Routing Node.
    Assigns department, worker (officer), creates the DB record, 
    and initializes the Domino's tracker flow.
    """
    node_name = "geo_routing"
    print(f"--- Entering Node: {node_name} ---")
    
    category = state.get("category", "Other")
    severity = state.get("severity", "Low")
    
    # 1. Deterministic Routing
    assigned_dept = map_department(category)
    sla_deadline = calculate_sla(severity)
    
    # 2. Assign a worker (We simulate this by picking a random officer or generating an ID for the hackathon)
    assigned_officer_id = str(uuid.uuid4()) # In reality, we query the Users table for role == "officer" in that pincode.
    
    # 3. Create/Update DB Record
    complaint_id = str(uuid.uuid4()) # For simplification in this step. Usually created at ingestion.
    
    try:
        async with AsyncSessionLocal() as session:
            new_complaint = Complaint(
                id=complaint_id,
                raw_text=state.get("original_text", ""),
                anonymised_text=state.get("translated_text", ""),
                category=category,
                severity=severity,
                confidence=state.get("confidence_score", 1.0),
                department=assigned_dept,
                status="assigned", # Starts the Domino's tracker!
                officer_id=assigned_officer_id
            )
            session.add(new_complaint)
            await session.commit()
            print(f"Complaint {complaint_id} saved to DB and assigned to Officer {assigned_officer_id}")
    except Exception as e:
        print(f"Database Routing Error: {e}")

    # 4. Update State
    return {
        **state,
        "department": assigned_dept,
        "sla_deadline": sla_deadline.isoformat(),
        "current_node": node_name,
        "history": state.get("history", []) + [f"Routed to {assigned_dept}. SLA Deadline: {sla_deadline}. Officer Assigned: {assigned_officer_id}. Status: assigned"]
    }
