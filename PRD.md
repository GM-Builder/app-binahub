# PRD v0.3

# BinaHub Transformation Operating System (Practical Architecture Version)

Status: Ready for System Design & Engineering Breakdown
Focus: MVP → Scalable System Foundation

---

# 1. Product Vision (disederhanakan tapi tetap kuat)

BinaHub adalah sistem yang membantu organisasi:

> Mengelola perjalanan perubahan manusia dari aktivitas nyata → bukti → insight → keputusan.

---

## North Star (disederhanakan)

Bukan:

* jumlah assessment
* jumlah training
* jumlah report

Tetapi:

```text id="n4v2pz"
Jumlah individu yang memiliki peningkatan capability terukur berbasis evidence dalam periode tertentu
```

---

# 2. Core Principle (yang wajib ditaati sistem)

## 1. Work-first, not AI-first

Sistem harus berjalan tanpa AI.

AI hanya lapisan interpretasi.

---

## 2. Evidence is the source of truth

Tidak ada “skor opini” tanpa evidence.

---

## 3. Capability is derived, not input

Capability tidak diisi manual sebagai primary data.

---

## 4. Everything must map to a real workflow

Tidak ada konsep yang tidak punya action nyata di UI.

---

# 3. Core System Architecture (FINAL SIMPLIFIED MODEL)

Ini versi yang lebih implementable.

---

## LAYER 1 — Tenant & Organization Layer

```text id="0c7x2q"
Tenant
└── Organization
```

### Fungsi:

* isolasi data
* multi client
* billing future-ready

---

## LAYER 2 — Work Layer (INI YANG PENTING SEKALI)

```text id="9x8d3m"
Organization
└── Engagement
```

### Engagement adalah unit kerja utama

Contoh:

* Assessment Project
* Leadership Program
* Coaching Program
* Transformation Program

---

### Engagement Status (STATE MACHINE)

```text id="k2p9qz"
Draft
Active
In Progress
Review
Completed
Archived
```

---

## LAYER 3 — People Layer

```text id="p7m3kq"
Participant
Facilitator
Admin
```

### Participant memiliki:

* profile
* engagement history
* capability history (derived)
* evidence history

---

## LAYER 4 — Evidence System (CORE ENGINE)

```text id="e8v2sx"
Evidence
```

### Evidence Types (REAL IMPLEMENTABLE)

```text id="t3x9qd"
Assessment Result
Reflection Entry
Facilitator Observation
Survey Response
Action Completion
Coaching Note
Manager Feedback
```

---

### Evidence Schema

```text id="a91kqv"
Evidence:
- id
- type
- participant_id
- engagement_id
- timestamp
- source (participant/facilitator/system/manager)
- content (structured JSON/text)
- tags
- linked_capability
- confidence_score
```

---

## LAYER 5 — Capability Layer (DERIVED)

```text id="c4n8zp"
Capability
```

### Contoh:

* Leadership
* Communication
* Collaboration
* Execution
* Strategic Thinking

---

### Important Rule:

Capability = computed from evidence

Bukan input manual utama.

---

### Capability Calculation (simple rule for MVP)

```text id="m1q7wv"
Capability Score =
weighted average of:
- assessment evidence
- reflection signals
- facilitator observations
- manager feedback
```

---

## LAYER 6 — Behavior Layer (OPTIONAL MVP+, TIDAK WAJIB DIAWAL)

```text id="b6r9tp"
Behavior Signal
```

Contoh:

* lebih aktif mendengar
* lebih tegas dalam keputusan
* lebih konsisten follow-up

---

Behavior diturunkan dari:

* facilitator notes
* reflection text analysis

---

## LAYER 7 — Outcome Layer (BUSINESS VIEW)

```text id="o3x8nv"
Outcome
```

Contoh:

* Leadership Readiness
* Team Performance Index
* Culture Health
* Engagement Level

---

Outcome = agregasi capability + business context

---

# 4. PRODUCT MODULES (REAL IMPLEMENTATION VERSION)

## MODULE 1 — Authentication & Role System (EXISTING)

* Client
* Facilitator
* Admin

---

## MODULE 2 — Engagement Management (NEW CORE MODULE)

### UI Pages:

* Engagement List
* Engagement Detail
* Participant Assignment
* Status Tracking

---

## MODULE 3 — Evidence Engine (CRITICAL)

### Pages:

* Add Evidence
* Evidence Timeline
* Evidence Detail
* Evidence Mapping to Capability

---

### Popups:

* Add Reflection
* Add Observation
* Add Assessment Result
* Add Action Completion
* Add Coaching Note

---

## MODULE 4 — Participant Workspace

### Pages:

* Participant Profile
* Capability Progress
* Evidence Timeline
* Action Plan
* Reflection Journal

---

## MODULE 5 — Facilitator Workspace (HIGH PRIORITY)

### Pages:

* My Engagements
* Participant List
* Evaluation Queue
* Observation Input
* Report Builder

---

### Popups:

* Quick Observation
* AI Summary Draft
* Evaluation Form

---

## MODULE 6 — Action System (IMPORTANT BRIDGE)

### Pages:

* Action List
* Action Detail
* Progress Tracking

---

### State:

```text id="x8m2nv"
To Do
In Progress
Blocked
Completed
```

---

## MODULE 7 — Intelligence Layer (AI MODULE, LATER STAGE)

### Pages:

* Insight Dashboard
* Capability Analysis
* Organization Health
* Recommendation Engine

---

# 5. TRANSFORMATION FLOW (END-TO-END SYSTEM)

Ini flow paling penting:

```text id="f4k9xz"
Engagement Created
        ↓
Participants Assigned
        ↓
Evidence Collected
        ↓
Capability Computed
        ↓
Insight Generated
        ↓
Action Created
        ↓
Outcome Measured
```

---

# 6. DATA FLOW PRINCIPLE (KRITIS UNTUK ENGINEERING)

## Rule 1

Semua UI write → Evidence

---

## Rule 2

Tidak ada Capability input manual utama

---

## Rule 3

AI hanya membaca Evidence, tidak menggantikan Evidence

---

## Rule 4

Semua insight harus traceable ke Evidence

---

# 7. AI STRATEGY (REDEFINED)

## Bima AI bukan chatbot

Bima AI adalah:

```text id="i6p4xz"
Evidence Interpreter + Insight Generator
```

---

### AI Responsibilities:

* summarize evidence
* cluster patterns
* suggest capability gaps
* generate facilitator report draft
* generate executive insight

---

### AI Cannot:

* invent evidence
* override raw data
* produce untraceable conclusions

---

# 8. MVP SCOPE (REALISTIC VERSION)

## Phase 1 (Current System Stabilization)

* Auth
* Engagement basic CRUD
* Participant assignment
* Basic Evidence (assessment + facilitator note)
* Simple dashboard

---

## Phase 2 (Core System)

* Evidence Engine fully structured
* Reflection system
* Action tracking
* Participant workspace

---

## Phase 3 (Intelligence Layer v1)

* Capability computation v1
* Facilitator workspace
* Basic AI summaries

---

## Phase 4 (Executive Layer)

* Organization dashboard
* Outcome tracking
* Trend analysis

---

# 9. WHAT WE REMOVED (IMPORTANT DECISION)

Untuk menjaga implementability:

❌ Capability sebagai input utama
❌ Outcome sebagai AI-only concept
❌ Behavior layer terlalu awal
❌ Mission system (ditunda)
❌ Knowledge hub (ditunda)
❌ Complex graph visualization (ditunda)

---

# 10. FINAL PRODUCT DEFINITION

BinaHub v0.3 adalah:

```text id="z9v4qx"
Evidence-Based Transformation Operating System
```

yang memiliki 3 kemampuan inti:

---

## 1. Capture reality (Evidence Engine)

---

## 2. Structure human development (Capability System)

---

## 3. Interpret change (Intelligence Layer)

---

# PENUTUP (KRITIS)

Saya jujur di sini:

PRD v0.3 ini lebih “implementable”, tapi juga lebih “keras”.

Karena:

* mengurangi abstraksi berlebihan
* memaksa sistem mengikuti real workflow
* membuat AI tunduk pada data
* mengunci evidence sebagai pusat

Dan ini penting.

Karena platform seperti ini tidak gagal karena ide.

Tapi gagal karena:

> terlalu cepat menjadi terlalu pintar sebelum menjadi benar-benar dipakai.

---
