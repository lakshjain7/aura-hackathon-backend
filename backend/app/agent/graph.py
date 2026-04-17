from langgraph.graph import StateGraph, END
from app.agent.state import AgentState

# Import all nodes
from app.agent.nodes.input_ingestion import input_ingestion
from app.agent.nodes.zero_trust_supervisor import zero_trust_supervisor
from app.agent.nodes.priority_classify import priority_classify
from app.agent.nodes.geo_routing import geo_routing
from app.agent.nodes.systemic_auditor import systemic_auditor
from app.agent.nodes.dual_key_resolution import dual_key_resolution
from app.agent.nodes.correction_loop import correction_loop

def define_graph():
    # 1. Initialize Graph
    workflow = StateGraph(AgentState)

    # 2. Add Nodes
    workflow.add_node("ingestion", input_ingestion)
    workflow.add_node("supervisor", zero_trust_supervisor)
    workflow.add_node("classify", priority_classify)
    workflow.add_node("routing", geo_routing)
    workflow.add_node("auditor", systemic_auditor)
    workflow.add_node("resolution", dual_key_resolution)
    workflow.add_node("correction", correction_loop)

    # 3. Define Entry Point
    workflow.set_entry_point("ingestion")

    # 4. Define Edges & Conditional Routing
    workflow.add_edge("ingestion", "supervisor")

    # Supervisor conditional edge
    workflow.add_conditional_edges(
        "supervisor",
        lambda state: "classify" if state.get("is_safe") else "end",
        {
            "classify": "classify",
            "end": END
        }
    )

    workflow.add_edge("classify", "routing")
    workflow.add_edge("routing", "auditor")
    workflow.add_edge("auditor", "resolution")
    workflow.add_edge("resolution", "correction")
    workflow.add_edge("correction", END)

    # 5. Compile
    return workflow.compile()

# Singleton instance
aura_graph = define_graph()
