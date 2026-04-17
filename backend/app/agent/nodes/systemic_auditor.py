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
            # Check for systemic threshold (e.g., 5 complaints in same area/category)
            if cluster.count >= 5:
                cluster.flagged_as_systemic = True
                print(f"!!! SYSTEMIC FAILURE DETECTED in {pincode} for {category} !!!")
            cluster_id = cluster.id
        else:
            # Create new cluster
            new_cluster = Cluster(
                category=category,
                pincode=pincode,
                count=1
            )
            session.add(new_cluster)
            await session.flush() # Get the ID
            cluster_id = new_cluster.id
            
        await session.commit()
        
    return {
        **state,
        "cluster_id": cluster_id,
        "current_node": node_name,
        "history": state.get("history", []) + [f"Grouped into Cluster {cluster_id}. Check for systemic load."]
    }
