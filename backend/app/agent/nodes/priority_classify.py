import json
from textblob import TextBlob
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.future import select
from sqlalchemy import func

from app.agent.state import AgentState
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.complaint import Complaint

# Initialize the classification model (we use standard gpt-4o for high reasoning, but mini for speed in hackathon)
classifier_llm = ChatOpenAI(
    model="gpt-4o-mini", 
    api_key=settings.OPENAI_API_KEY,
    temperature=0,
    model_kwargs={"response_format": {"type": "json_object"}}
)

IMPACT_MATRIX_PROMPT = """
You are the AURA Impact Matrix Engine.
Your job is to analyze civic complaints and output STRICT JSON determining the Category and Severity.

Categories: ["Roads", "Water", "Sanitation", "Electricity", "Safety", "Noise", "Other"]
Severities: ["Low", "Medium", "High", "Critical"]

### Auto-Escalation Rules:
- If the text mentions "hospital", "school", "accident", "death", "fire", or "live wire", Severity MUST be "Critical".
- If the text mentions "no water for X days" (where X > 2), Severity MUST be "High" or "Critical".
- If the sentiment is marked as highly distressed (System will provide this hint), bump the severity up one level.

Return ONLY JSON:
{
    "category": "String",
    "severity": "String",
    "confidence": 0.0 to 1.0,
    "reasoning": "String explanation mapping to the rules"
}
"""

async def priority_classify(state: AgentState) -> AgentState:
    """
    Agentic Brain Node: Analyzes sentiment, queries historical DB context, and maps Impact Matrix.
    """
    node_name = "priority_classify"
    print(f"--- Entering Node: {node_name} ---")
    
    text_to_analyze = state.get("translated_text", state.get("original_text", ""))
    
    # 1. Fast Sentiment Polarity Scoring
    # polarity ranges from -1.0 (very negative) to 1.0 (very positive)
    blob = TextBlob(text_to_analyze)
    sentiment_score = blob.sentiment.polarity
    print(f"Sentiment Score: {sentiment_score}")
    
    # Let's add a hint for the LLM if they are highly distressed
    distress_hint = "\n[SYSTEM HINT: The citizen exhibits high emotional distress. Consider bumping severity.]" if sentiment_score < -0.4 else ""

    # 2. Historical DB Context Retrieval (Heuristic Count)
    # Since we might not have a pincode yet, we will just count global unresolved complaints 
    # to understand global system stress, or we can just mock a historical_count query.
    historical_count = 0
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(func.count(Complaint.id)).where(Complaint.status == "pending"))
            historical_count = result.scalar()
    except Exception as e:
        print(f"DB Context Read Error: {e}")

    # 3. GPT-4o Impact Matrix Evaluation
    prompt_with_context = IMPACT_MATRIX_PROMPT + distress_hint + f"\n\nHistorical unresolved cases load: {historical_count}"
    
    try:
        response = await classifier_llm.ainvoke([
            SystemMessage(content=prompt_with_context),
            HumanMessage(content=text_to_analyze)
        ])
        
        # Parse output
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
            
        result = json.loads(content)
        category = result.get("category", "Other")
        severity = result.get("severity", "Medium")
        confidence = float(result.get("confidence", 0.5))
        reasoning = result.get("reasoning", "")
        
        print(f"Classified -> {category} | {severity} | Confidence: {confidence}")
        
    except Exception as e:
        print(f"Classification Error: {e}")
        # Graceful fallback
        category = "Other"
        severity = "Medium"
        confidence = 0.5
        reasoning = "Fallback due to JSON parsing error."

    # 4. Confidence Triage Layer
    needs_human = False
    if confidence < 0.80:
        needs_human = True
        print("Triage Alert: Confidence below 0.80. Flagging for Human Review.")
        
    return {
        **state,
        "category": category,
        "severity": severity,
        "confidence_score": confidence,
        "sentiment_score": sentiment_score,
        "historical_count": historical_count,
        "needs_human_review": needs_human,
        "current_node": node_name,
        "history": state.get("history", []) + [f"Classified as {category} ({severity}). Reasoning: {reasoning}"]
    }
