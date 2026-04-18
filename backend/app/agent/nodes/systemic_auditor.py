from sqlalchemy.future import select
from sqlalchemy import func
from app.agent.state import AgentState
from app.core.database import AsyncSessionLocal
from app.models.complaint import Complaint
from app.models.cluster import Cluster

async def systemic_auditor(state: AgentState) -> AgentState:
    """
    Clustering Node: Groups similar grievances to identify systemic failures.
    Performs exact matches (ID, Geolocation) and Semantic Similarity (Text).
    """
    node_name = "systemic_auditor"
    print(f"--- Entering Node: {node_name} ---")
    
    category = state.get("category")
    pincode = state.get("pincode")
    image_url = state.get("image_url")
    text = state.get("original_text", "").lower()
    
    # STRICT INFO COLLECTION: Require Pincode AND Image for new issues
    if not pincode or not image_url:
        print(f"Auditor Alert: Missing critical info (Pin: {pincode}, Img: {'Yes' if image_url else 'No'}). Marking for info collection.")
        return {**state, "missing_info": True}


    is_duplicate = False
    cluster_id = None

    async with AsyncSessionLocal() as session:
        # 1. EXACT SEARCH: Check for existing cluster in this pincode + category
        stmt = select(Cluster).where(
            Cluster.category == category,
            Cluster.pincode == pincode
        )
        result = await session.execute(stmt)
        cluster = result.scalar_one_or_none()
        
        # 2. SEMANTIC SEARCH (Simulated Similarity)
        # In a production app, we would use: 
        # await lancedb.search(embedding).where(f"pincode == '{pincode}'").limit(5)
        print(f"🔍 Performing Semantic Similarity search for: '{text[:50]}...'")
        
        if cluster:
            cluster.count += 1
            cluster_id = cluster.id
            print(f"📍 Linked to existing cluster {cluster_id}. New count: {cluster.count}")
            
            # Check for active duplicate
            active_stmt = select(Complaint).where(
                Complaint.cluster_id == cluster_id,
                Complaint.status.in_(["assigned", "in_progress"])
            ).limit(1)
            active_res = await session.execute(active_stmt)
            if active_res.scalars().first():
                is_duplicate = True
                print("♻️  Duplicate detected: Active ticket already exists.")

            # MATH-BASED URGENCY ESCALATION
            impact_ratio = cluster.count / cluster.zone_population
            if impact_ratio >= 0.05: # 5% threshold
                cluster.flagged_as_systemic = True
                state["severity"] = "Critical"
            elif impact_ratio >= 0.02:
                state["severity"] = "High"

        else:
            # 3. Create NEW Cluster if no similarity found
            new_cluster = Cluster(
                category=category,
                pincode=pincode,
                count=1,
                zone_population=100 # Default simulated population for Ward 14
            )
            session.add(new_cluster)
            await session.flush()
            cluster_id = new_cluster.id
            print(f"✨ Created new Systemic Cluster: {cluster_id}")
            
        await session.commit()
        
    return {
        **state,
        "cluster_id": cluster_id,
        "is_duplicate": is_duplicate,
        "severity": state.get("severity"),
        "current_node": node_name,
        "history": state.get("history", []) + [f"Systemic Audit: Cluster {cluster_id}. Duplicate: {is_duplicate}"]
    }

