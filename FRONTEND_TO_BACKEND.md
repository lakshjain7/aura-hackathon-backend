# AURA — Frontend to Backend Wiring Guide

## Project Overview

**AURA** (Agentic Unified Resolution Architecture) is a FastAPI-based government grievance redressal system with a 7-node LangGraph AI pipeline. **The backend is ~95% complete. The frontend is 0% built — nothing exists yet.**

---

## Existing Backend Endpoints (8 Total)

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | GET | `/health` | Health check |
| 2 | GET | `/api/discord/status` | Discord bot status |
| 3 | POST | `/api/sarvam/translate-audio` | Transcribe + translate Indic audio |
| 4 | GET | `/api/stream/complaint/{complaint_id}` | **SSE stream** of LangGraph processing |
| 5 | POST | `/api/tracking/ping` | Officer GPS location update |
| 6 | GET | `/api/tracking/live/{complaint_id}` | Get live officer GPS |
| 7 | POST | `/api/tracking/checkpoint` | Officer uploads proof-of-work with notes |
| 8 | POST | `/webhook/twilio` | WhatsApp/SMS inbound handler |

---

## Frontend Pages, Buttons & Wiring Needed

### A. Citizen Portal

#### `/submit` — Complaint Submission
**Buttons/Fields:**
- Text area: complaint description
- File upload: image or audio
- Pincode input field
- Submit button

**API Wiring:**
- POST to a new endpoint `/api/complaint` *(missing — must be created)*
- After submission → subscribe SSE at `GET /api/stream/complaint/{id}`
- Show live progress: "Analyzing..." → "Routing..." → "Assigned to officer!"

---

#### `/tracker/{complaint_id}` — Domino's-style Tracker
**Buttons/UI:**
- Timeline stages: Pending → Assigned → En-route → In-progress → Resolved
- SLA countdown timer
- Checkpoint cards with AI-friendly summaries + proof images
- Live map dot showing officer location

**API Wiring:**
- `GET /api/tracking/live/{complaint_id}` — poll every 5 seconds for officer GPS
- `GET /api/stream/complaint/{id}` — SSE for real-time node progress
- `GET /api/complaint/{id}` *(missing)*

---

#### `/my-complaints` — History
**UI:** List/card view with status badges, sort/filter

**API Wiring:** `GET /api/complaints?user_id=...` *(missing)*

---

### B. Officer/Worker Portal

#### `/officer/queue` — Assignment Queue
**Buttons:**
- "Start" button per complaint → marks as en_route, begins GPS tracking
- Sort by SLA deadline (red if < 4 hrs)

**API Wiring:**
- `GET /api/officer/{id}/assignments` *(missing)*
- `POST /api/officer/{id}/start/{complaint_id}` *(missing)*

---

#### `/officer/active/{complaint_id}` — Active Complaint
**Buttons/Fields:**
- Stage dropdown: arrived / in_progress / resolved
- Text area: raw notes
- Image upload: proof photo
- "Submit Checkpoint" button
- "Mark Resolved" button
- "Override AI Classification" expandable section → dropdowns for category/department + "Submit Correction"

**API Wiring:**
- `POST /api/tracking/ping` *(exists)* — browser calls `navigator.geolocation.watchPosition()`, auto-sends GPS every 10 sec
- `POST /api/tracking/checkpoint` *(exists)* — submit proof + notes
- `POST /api/complaint/{id}/correction` *(missing)* — RLHF override

---

### C. Admin/Councillor Portal

#### `/admin` — System Dashboard
**UI:** Stat cards, department bar chart, systemic alerts list

**API Wiring:**
- `GET /api/admin/stats` *(missing)*
- `GET /api/clusters?flagged=true` *(missing)*
- `GET /api/audit-logs` *(missing)*

---

#### `/admin/systemic` — Cluster/Systemic Issues
**Buttons:**
- "Send Proactive Alert to Councillor" per cluster

**API Wiring:**
- `GET /api/clusters` *(missing)*
- `POST /api/clusters/{id}/alert` *(missing)*

---

#### `/admin/officers` — Officer Management
**Buttons:**
- "Assign Complaint", "Edit Coverage Area", "Reassign"

**API Wiring:**
- `GET /api/users?role=officer` *(missing)*
- `PUT /api/officer/{id}/coverage` *(missing)*
- `POST /api/complaint/{id}/reassign` *(missing)*

---

### D. Auth

#### `/login` — OTP Login
**UI:**
- Step 1: Phone number input + "Send OTP" button
- Step 2: 6-digit OTP input + "Verify" button
- Redirect by role: citizen → `/`, officer → `/officer`

**API Wiring:**
- `POST /api/auth/request-otp` *(missing)*
- `POST /api/auth/verify-otp` *(missing)*
- Store JWT in localStorage; attach to all requests as `Authorization: Bearer {token}`

---

## 18 Missing Backend Endpoints (Frontend Can't Work Without These)

These need to be created in the backend before or alongside frontend development:

1. `POST /api/complaint` — web channel submission
2. `GET /api/complaint/{id}` — full complaint details
3. `GET /api/complaints` — list with pagination
4. `GET /api/officer/{id}/assignments` — officer queue
5. `POST /api/officer/{id}/start/{complaint_id}` — mark en_route
6. `POST /api/complaint/{id}/correction` — RLHF override
7. `GET /api/stats` — global stats
8. `GET /api/admin/stats` — admin stats
9. `GET /api/clusters` — list clusters
10. `POST /api/clusters/{id}/alert` — proactive alert
11. `GET /api/audit-logs` — paginated logs
12. `GET /api/users` — list users by role
13. `PUT /api/officer/{id}/coverage` — update coverage
14. `POST /api/complaint/{id}/reassign` — reassign officer
15. `POST /api/auth/request-otp` — OTP request
16. `POST /api/auth/verify-otp` — OTP verify + JWT
17. `GET /api/user/profile` — current user
18. `PUT /api/user/phone` — update phone

---

## 3 Critical Frontend Wiring Patterns

**1. SSE Stream (LangGraph real-time progress)**
```js
const es = new EventSource(`/api/stream/complaint/${id}`);
es.onmessage = (e) => { /* update progress UI */ };
```

**2. Live GPS Polling (Citizen tracker)**
```js
setInterval(async () => {
  const { active, lat, lng } = await fetch(`/api/tracking/live/${id}`).then(r => r.json());
  if (active) updateMapMarker(lat, lng);
}, 5000);
```

**3. Background GPS Reporting (Officer worker)**
```js
navigator.geolocation.watchPosition(pos => {
  fetch('/api/tracking/ping', { method: 'POST', body: JSON.stringify({
    officer_id, complaint_id, lat: pos.coords.latitude, lng: pos.coords.longitude
  })});
});
```

---

## Recommended Frontend Stack

- **React + TypeScript** — routing, components
- **react-router-dom** — page routing
- **react-query** — polling + server state
- **Leaflet / Google Maps React** — GPS map display
- **eventsource** or native `EventSource` — SSE stream
- **shadcn/ui or Material-UI** — component library

---

## Backend AI Pipeline (Already Built — Do Not Touch)

### LangGraph Flow
```
ingestion → supervisor → classify → routing → auditor → resolution → correction → END
```

| Node | File | What it does |
|------|------|-------------|
| Input Ingestion | `input_ingestion.py` | Detects audio/image, Sarvam STT, PII stripping |
| Zero-Trust Supervisor | `zero_trust_supervisor.py` | GPT-4o-mini security gate (prompt injection, spam) |
| Priority Classify | `priority_classify.py` | Category, severity, confidence scoring |
| Geo-Routing | `geo_routing.py` | Maps category → department, sets SLA, creates DB record |
| Systemic Auditor | `systemic_auditor.py` | Clusters complaints by pincode + category |
| Dual-Key Resolution | `dual_key_resolution.py` | Officer + citizen both confirm resolution |
| Correction Loop | `correction_loop.py` | Records RLHF corrections for future fine-tuning |

### Database Models
- **Complaint**: id, raw_text, anonymised_text, category, severity, confidence, department, pincode, status, officer_id, sla_deadline
- **User**: id, phone_encrypted, role (citizen/officer/admin/councillor), jwt_token
- **Checkpoint**: complaint_id, stage, image_url, raw_notes, citizen_summary (AI-generated)
- **Cluster**: category, pincode, count, flagged_as_systemic, proactive_alert_sent
- **AuditLog**: complaint_id, action, agent_name, details (JSON), timestamp
- **Correction**: complaint_id, original_category, corrected_category, officer_id (RLHF data)

### External Integrations
| Service | Purpose |
|---------|---------|
| OpenAI GPT-4o-mini | Security, classification, checkpoint summarization |
| Sarvam AI | Indic speech-to-text + auto-translation |
| Twilio | WhatsApp/SMS inbound channel |
| Discord | Officer bot channel |
| PostgreSQL | Primary datastore |
| Redis | Live GPS tracking (15-min TTL) |
