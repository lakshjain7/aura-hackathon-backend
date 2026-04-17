from sqlalchemy.future import select
from sqlalchemy import func
from app.agent.state import AgentState
from app.core.database import AsyncSessionLocal
from app.models.complaint import Complaint
from app.models.cluster import Cluster

async def systemic_auditor(state: AgentState) -> AgentState:
    """
    Clustering Node: Groups similar grievances to identify systemic failures.
    """
    node_name = "systemic_auditor"
    print(f"--- Entering Node: {node_name} ---")
    
    category = state.get("category")
    pincode = state.get("geography", {}).get("pincode") # We assume geo_routing or ingestion got this
    
    if not pincode or not category:
        print("Skipping clustering: Missing pincode or category.")
        return state

    async with AsyncSessionLocal() as session:
        # 1. Find existing cluster for this category/pincode
        stmt = select(Cluster).where(
            Cluster.category == category,
            Cluster.pincode == pincode
        )
        result = await session.execute(stmt)
        cluster = result.scalar_one_or_none()
        
        if cluster:
            cluster.count += 1
            # MATH-BASED URGENCY ESCALATION
            # Ratio = (Reports / Total Population)
            impact_ratio = cluster.count / cluster.zone_population
            
            print(f"Community Impact: {cluster.count} reports out of {cluster.zone_population} people. Ratio: {impact_ratio:.2%}")
            
            if impact_ratio >= 0.05: # 5% of the community reporting = Critical
                cluster.flagged_as_systemic = True
                state["severity"] = "Critical"
                print("!!! RATIO THRESHOLD EXCEEDED -> ESCALATING TO CRITICAL !!!")
            elif impact_ratio >= 0.02: # 2% = High
                state["severity"] = "High"
            
            cluster_id = cluster.id
        else:
            # Create new cluster
            new_cluster = Cluster(
                category=category,
                pincode=pincode,
                count=1,
                zone_population=100 # Default simulation population
            )
            session.add(new_cluster)
            await session.flush()
            cluster_id = new_cluster.id

            
        await session.commit()
        
    return {
        **state,
        "cluster_id": cluster_id,
        "severity": state.get("severity"),
        "current_node": node_name,
        "history": state.get("history", []) + [f"Community Cluster {cluster_id} detected. Total reports: {cluster.count if cluster else 1}. Priority: {state.get('severity')}"]
    }

