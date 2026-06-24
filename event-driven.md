# 1. FIA (Figma Information Architecture)

## BinaHub Transformation OS

Ini bukan sekadar sitemap.

Ini adalah **cara otak user bergerak di dalam sistem**.

---

# 1.1 CORE NAVIGATION MODEL

Saya sarankan struktur sidebar ini:

```text id="fia1"
Dashboard

Engagements
Participants
Evidence
Actions

Facilitator Workspace

Insights (AI)
Organization

Settings
```

---

## Prinsip FIA

* tidak berbasis fitur
* berbasis “kerja nyata user”
* semua menu = aktivitas harian

---

# 1.2 INFORMATION ARCHITECTURE PER ROLE

---

# A. PARTICIPANT IA

## Entry Point

```text id="p1"
Dashboard Participant
```

---

## Struktur

```text id="p2"
Dashboard
│
├── Active Engagement
│     ├── Overview
│     ├── Progress
│     └── Timeline
│
├── Reflection
│
├── Actions
│
├── Capability Growth
│
└── My Evidence
```

---

## Flow Mental Model

Participant tidak berpikir:

> “Saya isi assessment”

Tapi:

> “Saya sedang berkembang dalam program”

---

## Key Pages

### 1. Participant Dashboard

* score ringkas
* progress engagement
* action urgent
* reflection reminder

---

### 2. Engagement Detail

* timeline
* activity list
* facilitator feedback

---

### 3. Reflection Page

* daily/weekly prompt
* history

---

### 4. Action Page

* task list
* progress bar
* due date

---

### 5. Capability Page

* radar chart
* evidence breakdown

---

# B. FACILITATOR IA

## Entry Point

```text id="f1"
Facilitator Workspace
```

---

## Struktur

```text id="f2"
My Engagements
│
├── Participants
│     ├── List
│     ├── Profile
│     └── Progress
│
├── Evidence Input
│
├── Observation Queue
│
├── Evaluation Queue
│
├── Reports
│
└── AI Assistant
```

---

## Flow Mental Model

Facilitator tidak berpikir:

> “Saya input data”

Tapi:

> “Saya mengamati perubahan manusia”

---

## Key Pages

### 1. Engagement Overview

* progress org
* participant list
* risk indicator

---

### 2. Observation Input (critical page)

* quick note
* capability tag
* confidence level

---

### 3. Evaluation Queue

* pending participants
* review status

---

### 4. Report Builder

* AI draft
* editable
* export

---

# C. CLIENT / EXECUTIVE IA

## Entry Point

```text id="c1"
Executive Dashboard
```

---

## Struktur

```text id="c2"
Organization Overview
│
├── Engagements
│     ├── Active
│     ├── Completed
│
├── Outcome Dashboard
│
├── Capability Trends
│
├── Risk & Alerts
│
└── AI Insights
```

---

## Flow Mental Model

Executive tidak berpikir:

> “saya lihat training”

Tapi:

> “apakah organisasi saya berkembang?”

---

## Key Pages

### 1. Org Dashboard

* transformation health index
* trend graph
* engagement summary

---

### 2. Outcome Page

* leadership readiness
* culture index
* engagement score

---

### 3. Insight Page

* AI summary
* evidence breakdown
* recommendation

---

# 2. DESIGN SYSTEM (COMPONENT SYSTEM BINAHUB)

Ini bagian penting supaya Figma langsung bisa dibangun.

---

# 2.1 DESIGN PRINCIPLES

```text id="ds1"
1. Evidence-first UI
2. Minimal cognitive load
3. Workflow-based layout
4. Progressive disclosure
5. AI as assistant, not center
```

---

# 2.2 CORE COMPONENTS

---

## A. NAVIGATION

### Sidebar Item

* icon
* label
* badge (notification / pending work)

---

## B. CARDS SYSTEM

### 1. Engagement Card

```text id="dc1"
Title
Status
Progress bar
Participants count
Risk indicator
```

---

### 2. Capability Card

```text id="dc2"
Capability name
Score
Trend
Evidence count
```

---

### 3. Evidence Card

```text id="dc3"
Type
Source
Timestamp
Preview content
Linked capability
```

---

### 4. Action Card

```text id="dc4"
Title
Status
Due date
Progress
Assignee
```

---

## C. INPUT COMPONENTS

### 1. Evidence Input Form

* type selector
* participant selector
* capability tag
* text area
* confidence slider

---

### 2. Reflection Input

* prompt
* multiline answer
* submit button

---

### 3. Observation Quick Input

* 10 second input
* tag + note only

---

## D. VISUALIZATION

### 1. Capability Radar

* before vs after

---

### 2. Timeline View

```text id="dv1"
Assessment → Workshop → Coaching → Action → Impact
```

---

### 3. Transformation Graph

* capability relationships

---

## E. AI COMPONENTS

### 1. Insight Card

* summary
* evidence sources
* confidence score

---

### 2. Recommendation Block

* priority action
* impact estimation

---

### 3. AI Draft Panel

* editable text
* regenerate button

---

# 3. EVENT-DRIVEN ARCHITECTURE (CORE SYSTEM ENGINE)

Ini bagian paling penting untuk engineering.

---

# 3.1 CORE PRINCIPLE

Semua aktivitas = event

---

# 3.2 EVENT TYPES

```text id="ev1"
EvidenceCreated
ReflectionSubmitted
ObservationAdded
ActionUpdated
CapabilityRecalculated
InsightGenerated
EngagementUpdated
ParticipantAssigned
```

---

# 3.3 EVENT FLOW

## Example Flow

```text id="ev2"
1. Participant submits reflection
   ↓
ReflectionSubmitted event
   ↓
EvidenceCreated event
   ↓
CapabilityRecalculated event
   ↓
InsightGenerated event (async)
   ↓
Dashboard updated
```

---

# 3.4 SYSTEM DESIGN

## EVENT BUS MODEL

```text id="ev3"
Frontend Action
   ↓
API
   ↓
Database Write
   ↓
Event Trigger
   ↓
Worker (AI / computation)
   ↓
Update Capability / Insight
```

---

# 3.5 SUPABASE IMPLEMENTATION MODEL

## Option A (Simple MVP)

* DB triggers
* Edge functions

---

## Option B (Scale-ready)

* event_queue table
* worker system
* async processing

---

## EVENT QUEUE TABLE

```sql id="ev4"
event_queue {
  id
  type
  payload
  status (pending | processing | done | failed)
  created_at
}
```

---

# 3.6 CAPABILITY UPDATE ENGINE

Triggered by:

* EvidenceCreated
* ReflectionSubmitted
* ObservationAdded

---

Logic:

```text id="ev5"
Fetch all related evidence
Apply weighting
Recalculate score
Store in ParticipantCapability
```

---

# 3.7 AI PIPELINE (ASYNC)

Triggered by:

```text id="ev6"
CapabilityRecalculated
```

AI produces:

* Insight
* Risk detection
* Recommendation

---

# 4. SYSTEM BEHAVIOR (VERY IMPORTANT)

---

## RULE 1

UI NEVER directly writes capability

---

## RULE 2

All state changes must emit event

---

## RULE 3

AI never writes raw evidence

---

## RULE 4

All insight must link to evidence

---

# 5. FINAL SYSTEM SHAPE

Kalau disederhanakan:

```text id="finalsys"
UI Layer
   ↓
Event Layer
   ↓
Evidence System
   ↓
Capability Engine
   ↓
AI Intelligence Layer
   ↓
Executive Insight Layer
```

---

# 6. WHAT WE JUST ACHIEVED

Sekarang BinaHub sudah memiliki:

## 1. IA yang bisa langsung di-Figma-kan

## 2. Component system yang bisa langsung jadi design system

## 3. Event-driven architecture yang bisa langsung diimplementasi di Supabase

---

# 7. NEXT STEP (kalau kita lanjut)

Saya sarankan urutan ini:

### Step 1

Figma wireframe per role (Participant / Facilitator / Executive)

---

### Step 2

Database schema final (Supabase migration ready)

---

### Step 3

Event worker system (Edge functions + queue)

---

### Step 4

AI insight pipeline v1

---
