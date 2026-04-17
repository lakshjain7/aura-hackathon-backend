from app.agent.state import AgentState

async def dual_key_resolution(state: AgentState) -> AgentState:
    """
    Resolution Logic Node: Ensures both parties agree before closing.
    """
    node_name = "dual_key_resolution"
    print(f"--- Entering Node: {node_name} ---")
    
    officer_done = state.get("officer_resolution_status", False)
    citizen_confirmed = state.get("citizen_confirmation_status", False)
    
    status = "in_progress"
    if officer_done and citizen_confirmed:
        status = "resolved"
        print("Success: Dual-key handshake complete. Complaint resolved.")
    elif officer_done:
        print("Waiting for citizen confirmation...")
        status = "awaiting_citizen"
    
    return {
        **state,
        "current_node": node_name,
        "history": state.get("history", []) + [f"Resolution status: {status}"]
    }
