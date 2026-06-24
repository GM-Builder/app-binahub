# SYSTEM DESIGN — BinaHub v0.3

## Evidence-Based Transformation OS

---

# 1. HIGH-LEVEL ARCHITECTURE

```text id="arch1"
[Tenant Layer]
   ↓
[Organization Layer]
   ↓
[Engagement Layer]
   ↓
[People Layer]
   ↓
[Evidence Engine]
   ↓
[Capability Engine]
   ↓
[Intelligence Layer]
```

---

# 2. ERD (ENTITY RELATIONSHIP DESIGN)

Saya tulis dalam format implementable (Supabase/Postgres ready thinking).

---

## 2.1 CORE ENTITIES

### TENANT

```sql id="t1"
Tenant {
  id (uuid)
  name
  domain
  created_at
}
```

---

### ORGANIZATION

```sql id="t2"
Organization {
  id (uuid)
  tenant_id (fk)
  name
  industry
  size
  created_at
}
```

---

### ENGAGEMENT (CORE WORK UNIT)

```sql id="t3"
Engagement {
  id (uuid)
  organization_id (fk)
  title
  type (assessment | coaching | training | transformation)
  status (draft | active | in_progress | review | completed | archived)
  start_date
  end_date
  created_at
}
```

---

### PARTICIPANT

```sql id="t4"
Participant {
  id (uuid)
  organization_id (fk)
  name
  email
  role_title
  department
}
```

---

### ENGAGEMENT_PARTICIPANT (MANY TO MANY)

```sql id="t5"
EngagementParticipant {
  id
  engagement_id
  participant_id
  role (participant | leader | observer)
}
```

---

### FACILITATOR

```sql id="t6"
Facilitator {
  id
  name
  email
  specialization
}
```

---

### ENGAGEMENT_FACILITATOR

```sql id="t7"
EngagementFacilitator {
  engagement_id
  facilitator_id
  role (lead | assistant)
}
```

---

# 2.2 EVIDENCE ENGINE (CORE SYSTEM)

---

### EVIDENCE (MOST IMPORTANT TABLE)

```sql id="t8"
Evidence {
  id (uuid)
  engagement_id
  participant_id (nullable)
  type (
    assessment |
    reflection |
    observation |
    feedback |
    coaching_note |
    action_completion |
    survey
  )
  source (participant | facilitator | manager | system)
  content (jsonb)
  capability_tags (text[])
  confidence_score (float)
  created_at
}
```

---

### ACTION

```sql id="t9"
Action {
  id
  engagement_id
  participant_id
  title
  description
  status (todo | in_progress | blocked | done)
  due_date
  progress
}
```

---

### REFLECTION (optional separated table for performance UX)

```sql id="t10"
Reflection {
  id
  participant_id
  engagement_id
  question
  answer
  created_at
}
```

---

# 2.3 CAPABILITY ENGINE (DERIVED LAYER)

---

### CAPABILITY

```sql id="t11"
Capability {
  id
  name
  description
}
```

---

### PARTICIPANT_CAPABILITY (DERIVED RESULT)

```sql id="t12"
ParticipantCapability {
  id
  participant_id
  capability_id
  score (0-100)
  trend (up | down | stable)
  last_updated
}
```

---

### CAPABILITY_EVIDENCE_MAP

```sql id="t13"
CapabilityEvidence {
  id
  capability_id
  evidence_id
  weight
}
```

---

# 2.4 OUTCOME LAYER

---

### OUTCOME

```sql id="t14"
Outcome {
  id
  organization_id
  engagement_id
  name
  metric_value
  target_value
  status
}
```

---

# 2.5 AI & INTELLIGENCE LAYER

---

### INSIGHT

```sql id="t15"
Insight {
  id
  organization_id
  engagement_id
  title
  summary
  type (risk | improvement | recommendation)
  evidence_links (text[])
  confidence_score
}
```

---

### AI_GENERATION_LOG

```sql id="t16"
AIGenerationLog {
  id
  input_type
  input_id
  output_type
  output_id
  model
  created_at
}
```

---

# 3. API CONTRACT DESIGN

Saya buat REST-style (mudah dipindahkan ke Next.js / Supabase RPC).

---

## 3.1 AUTH

```http id="a1"
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

## 3.2 ORGANIZATION

```http id="a2"
GET  /organizations
POST /organizations
GET  /organizations/:id
```

---

## 3.3 ENGAGEMENT

```http id="a3"
GET  /engagements?org_id=
POST /engagements
GET  /engagements/:id
PATCH /engagements/:id/status
```

---

## 3.4 PARTICIPANTS

```http id="a4"
GET  /participants?org_id=
POST /participants
GET  /participants/:id
```

---

## 3.5 ASSIGNMENT

```http id="a5"
POST /engagements/:id/assign-participant
POST /engagements/:id/assign-facilitator
```

---

## 3.6 EVIDENCE ENGINE

```http id="a6"
POST /evidence
GET  /evidence?engagement_id=
GET  /evidence?participant_id=
GET  /evidence/:id
```

---

## 3.7 REFLECTION

```http id="a7"
POST /reflection
GET  /reflection?participant_id=
```

---

## 3.8 ACTION SYSTEM

```http id="a8"
POST /actions
PATCH /actions/:id
GET  /actions?participant_id=
```

---

## 3.9 CAPABILITY ENGINE

```http id="a9"
GET /capability/participant/:id
POST /capability/recalculate/:participant_id
```

---

## 3.10 INSIGHT ENGINE (AI)

```http id="a10"
POST /insights/generate
GET  /insights?organization_id=
GET  /insights/:id
```

---

# 4. UI FLOW PER ROLE

---

# 4.1 PARTICIPANT FLOW

## Entry Point

```text id="u1"
Login → Dashboard
```

---

## Dashboard

* Transformation Score
* Active Engagement
* Action Items
* Reflection Reminder

---

## Flow

```text id="u2"
Dashboard
   ↓
Engagement Detail
   ↓
Reflection Page
   ↓
Action Page
   ↓
Capability Progress
```

---

## Key Pages

### 1. Reflection Page

* Question prompt
* Text input
* Submit → Evidence created

---

### 2. Action Page

* task list
* status update
* progress tracking

---

### 3. Capability Page

* score
* trend
* evidence breakdown

---

# 4.2 FACILITATOR FLOW

## Dashboard

* Active Engagements
* Participants Overview
* Evaluation Queue

---

## Flow

```text id="u3"
Engagement List
   ↓
Participant List
   ↓
Evidence Input
   ↓
Observation Form
   ↓
Report Builder
```

---

## Key Pages

### 1. Observation Input

* select participant
* select capability
* write observation
* submit evidence

---

### 2. Evaluation Queue

* pending participants
* reviewed participants

---

### 3. Report Builder

* AI summary draft
* editable report
* export PDF

---

# 4.3 CLIENT / HR FLOW (EXECUTIVE)

## Dashboard

* Organization Health Index
* Engagement Status
* Risk Areas
* Recommendations

---

## Flow

```text id="u4"
Executive Dashboard
   ↓
Engagement Overview
   ↓
Outcome Detail
   ↓
Capability Trends
   ↓
Insight Page
```

---

## Key Pages

### 1. Organization Dashboard

* KPI transformation
* trend graph
* risk index

---

### 2. Outcome Page

* Leadership readiness
* culture index
* engagement score

---

### 3. Insight Page

* AI summary
* evidence breakdown
* recommendation

---

# 5. KEY POPUPS / MODALS (CRITICAL UX)

---

## 1. Add Evidence Modal

* type selector
* participant selector
* content input
* capability tag

---

## 2. Add Reflection Modal

* question
* answer
* submit

---

## 3. Add Action Modal

* title
* deadline
* assign participant

---

## 4. AI Insight Modal

* generated summary
* editable text
* evidence references

---

## 5. Observation Quick Input

* fast note
* capability tag
* submit in 10 seconds

---

# 6. CORE SYSTEM STATE MACHINE

---

## ENGAGEMENT

```text id="s1"
Draft → Active → In Progress → Review → Completed
```

---

## ACTION

```text id="s2"
Todo → In Progress → Blocked → Done
```

---

## EVIDENCE

```text id="s3"
Captured → Tagged → Processed → Used in Insight
```

---

# 7. SYSTEM BEHAVIOR RULES (SANGAT PENTING)

---

## Rule 1

Semua input user = Evidence

---

## Rule 2

AI tidak boleh membuat data baru tanpa evidence

---

## Rule 3

Capability harus bisa ditrace ke evidence

---

## Rule 4

Semua insight harus memiliki:

```text id="s4"
Evidence source links
```

---

# 8. IMPLEMENTATION PRIORITY (REALISTIC BUILD ORDER)

---

## PHASE 1

* Auth
* Organization
* Engagement
* Participant
* Basic Evidence (manual input)

---

## PHASE 2

* Reflection system
* Action system
* Facilitator observation
* Evidence timeline UI

---

## PHASE 3

* Capability computation v1
* Participant dashboard
* Facilitator workspace

---

## PHASE 4

* AI insight engine
* Executive dashboard
* Outcome tracking

---

# FINAL STATEMENT

Sekarang BinaHub bukan lagi:

* LMS
* Assessment tool
* Coaching app

Tapi sudah menjadi:

```text id="final1"
Evidence-Driven Transformation Operating System
```

yang secara struktur sudah siap untuk:

* multi-tenant SaaS
* AI intelligence layer
* long-term organizational data accumulation

---

