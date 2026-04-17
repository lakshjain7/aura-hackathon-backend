# AURA: Agentic Unified Resolution Architecture 🚀

### *The AI-Native Governance Engine for Public Grievance Redressal*
**Hackathon Project | Aligned with UN SDGs 11 & 16**

AURA is a production-ready, autonomous backend designed to transform how citizens interact with governance. Moving beyond simple chatbots, AURA utilizes a **LangGraph-orchestrated cyclic state machine** to ingest, sanitize, classify, and route grievances with zero-trust security and live physical tracking.

---

## 🏗️ Core Architecture (The Agentic Brain)

AURA operates on a multi-agent workflow where every grievance traverses a specialized intelligence pipeline:

1.  **Multimodal Ingestion**: Processes Text and Voice (WhatsApp/Discord) via **Sarvam AI** for native Indic translation.
2.  **Privacy Shield**: Automatically strips PII (Aadhaar, PAN, Names) using **spaCy NER** before LLM inspection.
3.  **Zero-Trust Supervisor**: A **GPT-4o-mini** guardrail that detects and blocks prompt injections or abuse.
4.  **Priority Classify Agent**: Computes an **Impact Matrix** using sentiment analysis (TextBlob) and historical DB context.
5.  **Geo-Routing Agent**: Assigns workers, sets SLA deadlines, and initializes the **Domino's Style Tracker**.

---

## 🛠️ Tech Stack

-   **Framework**: FastAPI (Async Python)
-   **Orchestration**: LangGraph (Cyclic State Management)
-   **Database**: PostgreSQL (Immutable Audit Logs) via **Railway Pro**
-   **In-Memory Store**: Redis (SLA Countdown Timers & Live Tracking)
-   **AI Integrations**: 
    - **Sarvam AI**: Indic STT + Translation
    - **OpenAI (GPT-4o)**: Complex Reasoning & Core Classification
    - **spaCy**: Legal Privacy Compliance (PII Redaction)
-   **Channels**: Twilio (WhatsApp), Discord (Officer Bot)

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- FFmpeg (for audio processing)
- Redis Server (or Railway URL)
- PostgreSQL (or Railway URL)

### 2. Setup Environment
```bash
# Clone and enter directory
cd Ai4Hackathon/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3. Configure `.env`
Copy the `.env.template` to a new `.env` file and populate your API keys for OpenAI, Sarvam, Twilio, and Railway connections.

### 4. Run Server
```bash
uvicorn app.main:app --reload
```

---

## 📍 API Highlights for Frontend Team

-   **`/api/tracking/live/{id}`**: GET live GPS coordinates of the assigned worker (from Redis).
-   **`/api/tracking/ping`**: POST endpoint for the worker application to update location.
-   **`/api/stream/complaint/{id}`**: SSE endpoint for real-time LangGraph node execution visualization.
-   **`/webhook/twilio`**: Incoming WhatsApp bridge.

---

## 🛡️ Security & Ethics
AURA is designed with **Privacy-by-Design**. No PII is ever sent to third-party LLMs without redaction, and the **Zero-Trust Supervisor** ensures the system cannot be manipulated via prompt injection or lateral privilege escalation.
