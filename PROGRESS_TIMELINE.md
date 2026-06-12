# AURA — Build Progress & Timeline

## Overall Completion

```
████████████████████░░░░░░░░░░  62% Complete
```

| Layer | Done | Pending | % |
|-------|------|---------|---|
| Infrastructure & Config | ✅ Full | — | 100% |
| Database Models & ORM | ✅ Full | — | 100% |
| PII Stripping & Security | ✅ Full | — | 100% |
| External Integrations | ✅ Full | — | 100% |
| LangGraph Orchestration | ✅ Full | — | 100% |
| AI Agents / Nodes | Nodes 1–5 done | Nodes 6–7 stubs | 71% |
| API Routes (existing) | 8 endpoints live | — | 100% |
| API Routes (missing) | 0 of 18 built | 18 endpoints | 0% |
| Real-time Streaming (SSE) | ✅ Full | — | 100% |
| GPS Tracking | ✅ Full | — | 100% |
| Auth (OTP + JWT) | — | Not started | 0% |
| Frontend | — | Not started | 0% |
| Tests / Migrations | — | Not started | 0% |

---

## Phase 1 — Infrastructure & Core Setup ✅ 100%

### Config & Environment
- [x] `config.py` — pydantic-settings loading all env vars
- [x] `.env.template` + `.env` — fully populated with real credentials
  - `OPENAI_API_KEY` ✅
  - `SARVAM_API_KEY` ✅
  - `DATABASE_URL` (PostgreSQL Railway) ✅
  - `REDIS_URL` (Railway) ✅
  - `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` ✅
  - `DISCORD_BOT_TOKEN` ✅
  - `GOOGLE_MAPS_API_KEY` ✅ (configured, unused)

### Database Layer
- [x] `database.py` — AsyncEngine + asyncpg for PostgreSQL, aiosqlite for dev
- [x] `AsyncSessionLocal` sessionmaker (expire_on_commit=False)
- [x] `get_db()` async dependency injector
- [x] `redis_client.py` — ConnectionPool, async `get_redis()` with cleanup

### Application Startup (`main.py`)
- [x] `Base.metadata.create_all()` on startup (auto-creates all tables)
- [x] Discord bot launched as background asyncio task
- [x] CORS configured (open for dev, flagged for prod tightening)
- [x] All 5 routers mounted with correct prefixes
- [x] Health check endpoint live

---

## Phase 2 — Database Models ✅ 100%

All 6 SQLAlchemy ORM models fully defined with proper types, relationships, and UUID primary keys (string-typed for SQLite compatibility):

| Model | Key Fields | Status |
|-------|-----------|--------|
| **Complaint** | id, raw_text, anonymised_text, category, severity, confidence, department, pincode, lat, lng, status, officer_id, cluster_id, sla_deadline, created_at, resolved_at, cpgrams_ref | ✅ Complete |
| **User** | id, phone_encrypted, role (citizen/officer/admin/councillor), otp_hash, jwt_token, created_at | ✅ Complete |
| **Checkpoint** | id, complaint_id (FK), stage, image_url, raw_notes, citizen_summary, timestamp | ✅ Complete |
| **Cluster** | id, complaint_ids, category, pincode, count, flagged_as_systemic, proactive_alert_sent, created_at | ✅ Complete |
| **AuditLog** | id, complaint_id (FK), action, agent_name, details (JSON), timestamp | ✅ Complete |
| **Correction** | id, complaint_id (FK), original_category, original_dept, corrected_category, corrected_dept, officer_id (FK), timestamp | ✅ Complete |

---

## Phase 3 — Security & NLP Utilities ✅ 100%

### PII Stripping (`pii_stripper.py`) — DPDP Act Compliant
- [x] **Aadhaar regex**: `\d{4}\s?\d{4}\s?\d{4}` → replaced with `[ID]`
- [x] **PAN regex**: `[A-Z]{5}[0-9]{4}[A-Z]` → replaced with `[ID]`
- [x] **Indian mobile regex**: `(?:\+91[-.\s]?)?[6789]\d{9}` → `[PHONE]`
- [x] **Email regex** → `[EMAIL]`
- [x] **spaCy NER** (`en_core_web_sm`) — PERSON entity detection → `[NAME]`
- [x] Returns `(anonymised_text, entities_dict)` tuple
- [x] Applied before any LLM sees the complaint text

### Sentiment Analysis (TextBlob) — in `priority_classify.py`
- [x] `TextBlob(text).sentiment.polarity` (-1.0 → 1.0)
- [x] Polarity < -0.4 → hints LLM to bump severity

---

## Phase 4 — External Integrations ✅ 100%

### 1. OpenAI GPT-4o-mini (3 integration points)
- [x] **Zero-Trust Supervisor** — security threat classification (JSON response)
- [x] **Priority Classify** — category + severity + confidence scoring (JSON response, temperature=0)
- [x] **Checkpoint Summarizer** — converts raw officer notes to citizen-friendly summary (tracking.py)

### 2. Sarvam AI — Indic STT + Translation (`sarvam_client.py`)
- [x] `POST https://api.sarvam.ai/speech-to-text-translate`
- [x] Model: `saaras:v1`
- [x] Header: `api-subscription-key`
- [x] Returns `transcript` field, error-handled with fallback

### 3. OpenAI Whisper (`whisper_client.py`) — Alternative, built but unused
- [x] `openai.audio.transcriptions.create(model="whisper-1")`
- [x] Returns raw text transcript

### 4. Twilio WhatsApp/SMS
- [x] Inbound webhook at `POST /webhook/twilio`
- [x] Parses `From`, `Body`, `MediaUrl0` from Twilio form data
- [x] Returns TwiML `MessagingResponse` XML

### 5. Discord Bot (`discord_bot.py`)
- [x] `AuraDiscordClient` inheriting `discord.Client`
- [x] `on_ready()` lifecycle hook
- [x] `on_message()` — skips bots, handles `!status`, routes everything else through LangGraph
- [x] `start_discord_bot()` launched at server startup

### 6. PostgreSQL (Railway) — via asyncpg
- [x] All DB writes in geo_routing, systemic_auditor, tracking
- [x] All DB reads in priority_classify (pending count), systemic_auditor (cluster lookup)

### 7. Redis (Railway) — via redis-py async
- [x] `SETEX tracking:{complaint_id}` → `lat,lng,officer_id` (900s TTL)
- [x] `GET tracking:{complaint_id}` → live location fetch

---

## Phase 5 — LangGraph Orchestration ✅ 100%

### `state.py` — AgentState (TypedDict)
- [x] `complaint_id`, `raw_text`, `translated_text`, `anonymised_text`
- [x] `category`, `severity`, `confidence_score`, `department`
- [x] `is_safe`, `rejection_reason`, `threat_type`
- [x] `sentiment_score`, `historical_count`, `needs_human_review`
- [x] `officer_id`, `sla_deadline`, `cluster_id`
- [x] `officer_resolution_status`, `citizen_confirmation_status`
- [x] `source` (whatsapp / discord / web), `history` (List[str])

### `graph.py` — Full Pipeline Wiring
- [x] All 7 nodes added to StateGraph
- [x] Linear edges: ingestion → supervisor → classify → routing → auditor → resolution → correction
- [x] **Conditional edge on supervisor**: `is_safe=False` → END, `is_safe=True` → classify
- [x] Graph compiled to `aura_graph` (importable singleton)

---

## Phase 6 — AI Agent Nodes

### Node 1: Input Ingestion ✅ 100%
```
ingestion → (detects audio/image) → downloads → Sarvam STT → PII strip → state update
```
- [x] Audio format detection by URL extension (.ogg, .mp3, .wav, .m4a)
- [x] httpx async download of WhatsApp media
- [x] Sarvam STT + auto-translation to English
- [x] PII stripping (Aadhaar, PAN, phone, email, names)
- [x] History append: "Input ingested from {source}. Multimodal: {is_audio}. PII Stripped."

---

### Node 2: Zero-Trust Supervisor ✅ 100%
```
supervisor → GPT-4o-mini → JSON {is_safe, threat_type, confidence, reasoning} → gate
```
- [x] GPT-4o-mini call at temperature=0
- [x] Detects: `prompt_injection`, `jailbreak`, `data_extraction`, `spam`, `abuse`
- [x] JSON parsed into state fields
- [x] Graceful fallback: LLM error → assume safe (innocent by default)
- [x] Conditional routing on `is_safe` → gates entire pipeline

---

### Node 3: Priority Classification ✅ 100%
```
classify → TextBlob sentiment → DB pending count → GPT-4o-mini Impact Matrix → auto-escalation rules
```
- [x] **TextBlob sentiment polarity** (-1.0 to 1.0) stored as `sentiment_score`
- [x] **Async DB query**: `SELECT COUNT(*) WHERE status="pending"` → `historical_count`
- [x] **GPT-4o-mini Impact Matrix**: outputs `category`, `severity`, `confidence_score`
- [x] Categories: Roads, Water, Sanitation, Electricity, Safety, Noise, Other
- [x] Severity levels: Low, Medium, High, Critical
- [x] **Auto-escalation**: keywords → hospital, school, accident, death, fire, live wire → Critical override
- [x] **Low confidence gate**: `confidence < 0.80` → `needs_human_review = True`
- [x] **Sentiment-severity link**: polarity < -0.4 → LLM instructed to bump severity

---

### Node 4: Geo-Routing ✅ 100%
```
routing → dept mapping → SLA calculation → UUID generation → PostgreSQL INSERT
```
- [x] Deterministic department mapping:
  - Roads → Public Works Dept (PWD)
  - Water → Water Supply Board
  - Sanitation → Municipal Corporation
  - Electricity → Electricity Board
  - Safety → Police / Emergency Services
  - Noise → Municipal Corporation
  - Other → General Administration
- [x] SLA deadlines: Critical=4h, High=24h, Medium=48h, Low=72h
- [x] UUID generated for complaint_id + officer_id (MVP random assignment)
- [x] **PostgreSQL INSERT**: Complaint row with status="assigned"
- [x] State updated: `department`, `sla_deadline`

---

### Node 5: Systemic Auditor ✅ 100%
```
auditor → SELECT cluster by category+pincode → INCREMENT count → flag if ≥5 → COMMIT
```
- [x] **PostgreSQL SELECT**: find cluster by (category, pincode)
- [x] If exists: `count += 1`, check `count >= 5` → `flagged_as_systemic = True`
- [x] If not exists: **INSERT** new Cluster row
- [x] `db.flush()` to get ID before commit
- [x] `cluster_id` written back to AgentState

---

### Node 6: Dual-Key Resolution ⚠️ 50%
```
resolution → reads officer + citizen status → updates state [NO DB WRITE, NO POLLING]
```
- [x] Reads `officer_resolution_status` and `citizen_confirmation_status` from state
- [x] Status logic: both confirmed → "resolved", officer only → "awaiting_citizen"
- [ ] Actual dual-key handshake mechanism not wired (no DB polling, no notification trigger)
- [ ] No Complaint.status UPDATE to "resolved" in DB
- [ ] No citizen notification sent on resolution

---

### Node 7: Correction Loop ❌ 5%
```
correction → [PLACEHOLDER ONLY]
```
- [x] History append only
- [ ] No RLHF trigger detection
- [ ] No comparison of original vs corrected classification
- [ ] No write to Corrections table
- [ ] No fine-tuning data export

---

## Phase 7 — API Routes

### Existing Routes ✅ 100% (8 endpoints live)

| Endpoint | Status | What's implemented |
|----------|--------|-------------------|
| `GET /health` | ✅ Live | Returns `{"status": "ok"}` |
| `GET /api/discord/status` | ✅ Live | Bot readiness string |
| `POST /api/sarvam/translate-audio` | ✅ Live | Sarvam STT wrapper |
| `GET /api/stream/complaint/{id}` | ✅ Live | SSE stream with asyncio.Queue per complaint |
| `POST /api/tracking/ping` | ✅ Live | Redis SETEX 900s TTL |
| `GET /api/tracking/live/{id}` | ✅ Live | Redis GET → lat/lng |
| `POST /api/tracking/checkpoint` | ✅ Live | GPT-4o-mini summarize + DB write + status update |
| `POST /webhook/twilio` | ✅ Live | Full LangGraph invocation + TwiML response |

### Missing REST Endpoints ❌ 0% (18 endpoints pending)

**Complaint CRUD**
- [ ] `POST /api/complaint` — web channel submission (non-Twilio)
- [ ] `GET /api/complaint/{id}` — fetch single complaint details
- [ ] `GET /api/complaints` — list with pagination + filters

**Officer Operations**
- [ ] `GET /api/officer/{id}/assignments` — assignment queue
- [ ] `POST /api/officer/{id}/start/{complaint_id}` — mark as en_route
- [ ] `POST /api/complaint/{id}/correction` — submit classification override

**Admin & Analytics**
- [ ] `GET /api/stats` — global platform stats
- [ ] `GET /api/admin/stats` — admin-level breakdown
- [ ] `GET /api/clusters` — list clusters (with `?flagged=true` filter)
- [ ] `POST /api/clusters/{id}/alert` — send proactive councillor alert
- [ ] `GET /api/audit-logs` — paginated, filterable audit log
- [ ] `GET /api/users` — list users (with `?role=officer` filter)
- [ ] `PUT /api/officer/{id}/coverage` — update coverage pincode area
- [ ] `POST /api/complaint/{id}/reassign` — manual reassignment

**Authentication**
- [ ] `POST /api/auth/request-otp` — send OTP via Twilio SMS
- [ ] `POST /api/auth/verify-otp` — verify + return JWT + role
- [ ] `GET /api/user/profile` — current user (JWT-gated)
- [ ] `PUT /api/user/phone` — update phone + re-verify

---

## Phase 8 — Real-time Features ✅ 100%

### SSE Streaming (`stream.py`)
- [x] `active_streams: Dict[str, asyncio.Queue]` — per-complaint queues
- [x] `emit_to_stream(complaint_id, event)` — push from anywhere in pipeline
- [x] `event_generator()` — yields SSE-formatted JSON continuously
- [x] Breaks on `type=="DONE"` or `status=="terminal"`
- [x] Queue cleanup on client disconnect (GeneratorExit handling)

### Live GPS Tracking (`tracking.py`)
- [x] `POST /api/tracking/ping` — officer device POSTs lat/lng every 10 seconds
- [x] Redis key: `tracking:{complaint_id}` → `"lat,lng,officer_id"`
- [x] 15-minute TTL (auto-expires when officer stops pinging)
- [x] `GET /api/tracking/live/{id}` — citizen polls every 5 seconds to update map

---

## Phase 9 — Pending Work

### High Priority (blocks hackathon demo)
- [ ] 18 missing REST endpoints (see Phase 7)
- [ ] Auth: OTP + JWT middleware (pyjwt + passlib already installed)
- [ ] Frontend: React app with all citizen/officer/admin pages
- [ ] Node 6 (Dual-Key Resolution): DB write + notification trigger
- [ ] Complaint web submission endpoint (so frontend can bypass Twilio)

### Medium Priority
- [ ] Node 7 (Correction Loop): RLHF write to `corrections` table
- [ ] Alembic migrations (currently using `create_all` on startup)
- [ ] Pagination on list endpoints
- [ ] JWT middleware for protected routes

### Low Priority / Future
- [ ] Google Maps integration (API key configured, unused)
- [ ] Proactive councillor alerts (cluster flagging done, alert dispatch missing)
- [ ] CPGRAMS integration (field exists on Complaint model)
- [ ] Fine-tuning data export from Corrections table
- [ ] Production CORS tightening
- [ ] Test suite (zero tests currently)
- [ ] OpenAI Whisper (built, not wired into flow)

---

## Feature Completion Breakdown

```
Infrastructure & Config     [██████████] 100%
Database Models             [██████████] 100%
PII Stripping (DPDP)        [██████████] 100%
Sentiment Analysis          [██████████] 100%
spaCy NER                   [██████████] 100%
OpenAI Integration          [██████████] 100%
Sarvam AI Integration       [██████████] 100%
Twilio Integration          [██████████] 100%
Discord Integration         [██████████] 100%
PostgreSQL Integration      [██████████] 100%
Redis Integration           [██████████] 100%
LangGraph Wiring            [██████████] 100%
SSE Real-time Streaming     [██████████] 100%
GPS Live Tracking           [██████████] 100%
Node 1: Input Ingestion     [██████████] 100%
Node 2: Zero-Trust          [██████████] 100%
Node 3: Classification      [██████████] 100%
Node 4: Geo-Routing         [██████████] 100%
Node 5: Systemic Auditor    [██████████] 100%
Node 6: Dual-Key Resolution [█████░░░░░]  50%
Node 7: Correction/RLHF     [░░░░░░░░░░]   5%
Missing REST Endpoints      [░░░░░░░░░░]   0%
Authentication (OTP+JWT)    [░░░░░░░░░░]   0%
Frontend                    [░░░░░░░░░░]   0%
Tests & Migrations          [░░░░░░░░░░]   0%

OVERALL                     [███████░░░]  62%
```

---

## What Works Right Now (End-to-End)

**WhatsApp → AURA → Response** (fully functional):
1. Citizen texts WhatsApp number
2. Twilio sends webhook to `/webhook/twilio`
3. LangGraph runs all 7 nodes:
   - Audio transcribed via Sarvam (if voice note)
   - PII stripped from text
   - GPT-4o-mini security check
   - TextBlob sentiment + GPT-4o-mini category/severity
   - Department assigned, SLA calculated, DB record created
   - Cluster updated, systemic flag set if ≥5 complaints
4. Complaint status visible via SSE stream
5. Officer GPS trackable via Redis ping/live endpoints
6. Officer checkpoints (with AI summaries) writable to DB

**Discord → AURA** (fully functional):
- Same pipeline, different inbound channel

**What does NOT work yet**:
- Any web-based citizen/officer/admin UI
- Login / authentication
- Fetching complaint details via REST API
- Officer assignment queue
- Admin dashboard and analytics
- Dual-key resolution confirmation
- RLHF correction recording
