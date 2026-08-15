# Synora — Technical Architecture Document

> **Personal Intelligence & Creativity OS**
> Version 1.0 · MVP Architecture

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [High-Level System Design](#3-high-level-system-design)
4. [Domain Decomposition](#4-domain-decomposition)
5. [Data Models](#5-data-models)
6. [Database Schema](#6-database-schema)
7. [API Contracts](#7-api-contracts)
8. [Event System](#8-event-system)
9. [Inference Pipeline](#9-inference-pipeline)
10. [Personal Model System](#10-personal-model-system)
11. [Discovery Engine](#11-discovery-engine)
12. [Queue & Worker Architecture](#12-queue--worker-architecture)
13. [AI & Inference Layer](#13-ai--inference-layer)
14. [Infrastructure & Deployment](#14-infrastructure--deployment)
15. [Security Architecture](#15-security-architecture)
16. [Observability](#16-observability)
17. [Frontend Architecture](#17-frontend-architecture)
18. [MVP Build Order](#18-mvp-build-order)

---

## 1. System Overview

Synora is an **event-driven, AI-native personal intelligence system**. Every meaningful user interaction produces an event. Events flow through a processing pipeline that extracts semantics, updates a personal model (comprising a Knowledge Graph, Taste Graph, and Creative Graph), and continuously improves personalized discovery and creation.

### Core Loop

```
EXPERIENCE
    ↓
EVENT (immutable, versioned)
    ↓
INGESTION PIPELINE
    ↓
SEMANTIC PROCESSING
    ↓
PERSONAL MODEL UPDATE
    ↓
REASONING
    ↓
DISCOVER / CREATE
    ↓
USER REACTION → NEW EVENT
```

### Technology Summary

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (token-driven) + Framer Motion |
| State | TanStack Query + Zustand |
| API | NestJS (TypeScript) + Fastify adapter |
| Queue | BullMQ backed by Redis |
| Primary DB | PostgreSQL 16 |
| Vector Search | pgvector extension |
| Full-text Search | PostgreSQL `tsvector` (OpenSearch at scale) |
| Cache | Redis 7 |
| Object Storage | S3-compatible (Cloudflare R2 / AWS S3) |
| OCR / Parsing | Azure Document Intelligence / Tesseract fallback |
| Embeddings | OpenAI `text-embedding-3-large` (swappable) |
| LLM Reasoning | OpenAI GPT-4o / Anthropic Claude (swappable) |
| STT | OpenAI Whisper |
| Observability | OpenTelemetry + Pino + Sentry |
| Container | Docker + Docker Compose (local); Kubernetes (production) |

---

## 2. Architecture Principles

### P1 — Personal Model is the Product
All services exist to populate, refine, and act on the personal model. No feature ships without a clear relationship to model quality.

### P2 — Events are Immutable
Raw events are never modified. Derived state (model nodes, preferences, inferences) can evolve. Corrections are new events, not edits.

### P3 — Long-running AI work never blocks API
All heavy processing (extraction, embedding, model update) is async via the queue. The API always returns immediately.

### P4 — Every AI service is replaceable
The personal model and event infrastructure are stable contracts. Underlying AI providers are swapped via adapters without changing domain logic.

### P5 — Privacy is structural
Deletion propagates through every downstream layer. Consent is explicit. Inferred data is labeled and distinguishable from user-provided data.

### P6 — Explainability is first-class
Every recommendation stores structured reasoning signals that the UI can surface without exposing internal chain-of-thought.

### P7 — Confidence is everywhere
Every inferred fact carries a confidence score, a provenance reference, and a timestamp. Uncertainty is a first-class data attribute.

---

## 3. High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  Web App (React)   Mobile (React Native)  Browser Ext.  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                      API GATEWAY                         │
│              NestJS · Auth Middleware · Rate Limit       │
└──┬────────┬────────┬────────┬────────┬──────────────────┘
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
[Capture] [Model] [Discovery] [Project] [Auth]
 Service  Service   Service    Service  Service
   │        │        │
   ▼        ▼        ▼
┌─────────────────────────────────────────────────────────┐
│                    MESSAGE QUEUE (BullMQ + Redis)         │
│  content_extraction · semantic_analysis · model_update  │
│  recommendation_refresh · embedding_refresh · deletion  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    WORKER SERVICE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Extraction  │  │  Inference   │  │  Model Update │  │
│  │  Worker      │  │  Worker      │  │  Worker       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                  │                   │          │
│         ▼                  ▼                   ▼          │
│   [OCR/Parse]      [Embed/Extract]      [Graph Update]   │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    STORAGE LAYER                          │
│   PostgreSQL + pgvector  │  Redis  │  Object Storage     │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    AI / INFERENCE LAYER                   │
│   LLM (reasoning)  │  Embeddings  │  OCR  │  STT        │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Domain Decomposition

Synora is organized into six backend domains. Each domain maps to a NestJS module and can be independently deployed.

### 4.1 Capture Domain
**Responsibility:** Accept, validate, and persist incoming captures (URLs, PDFs, text, audio, images). Issue a queue job for processing. Return immediately.

**Core operations:**
- Accept capture request
- Create Artifact record (status: `pending`)
- Upload raw file to object storage if applicable
- Emit `content_extraction` queue job
- Return Artifact ID + status

### 4.2 Ingestion & Inference Domain
**Responsibility:** Extract text, concepts, entities, relationships, and preference signals from raw artifacts. Assign confidence scores. Feed into the model update pipeline.

**Core operations:**
- Fetch artifact content
- OCR / document parse / STT
- Chunk and embed content
- Extract concepts, entities, topics
- Detect preference signals
- Score confidence
- Emit `model_update` job

### 4.3 Personal Model Domain
**Responsibility:** Own and update the three-layer personal model (Knowledge, Taste, Creative). Maintain temporal state. Support user corrections and inspectability.

**Core operations:**
- Upsert concept/preference/creative nodes
- Apply temporal decay to stale signals
- Apply explicit user corrections
- Record model snapshots
- Expose readable model summaries

### 4.4 Discovery Domain
**Responsibility:** Generate a personalized, explainable discovery feed by ranking external candidates against the personal model.

**Core operations:**
- Retrieve candidate pool (semantic search + external enrichment)
- Score candidates against personal model (relevance + novelty)
- Store reasoning signals per recommendation
- Return ranked, explainable feed
- Process feedback to update model

### 4.5 Creative & Project Domain
**Responsibility:** Maintain project workspaces, track creation history, and generate context-aware creative suggestions.

**Core operations:**
- Create/update projects and references
- Store creative outputs
- Cross-reference personal model for creation prompts
- Scoped context isolation per project

### 4.6 Platform Domain
**Responsibility:** Auth, privacy, notifications, analytics, settings.

---

## 5. Data Models

### 5.1 Core Entity Relationships

```
User
 ├── Events[]               (immutable log)
 ├── Artifacts[]            (captured content)
 ├── Concepts[]             (knowledge nodes)
 ├── Preferences[]          (taste signals)
 ├── Interests[]            (curiosity signals)
 ├── TasteState             (derived taste model)
 ├── KnowledgeState         (derived knowledge model)
 ├── CreativeState          (derived creative model)
 ├── Projects[]
 └── ModelSnapshots[]

Artifact
 ├── ArtifactVersions[]
 ├── Events[]
 ├── Concepts[]  (many-to-many via ArtifactConcept)
 └── Embeddings[]

Concept
 ├── Relationships[]  (ConceptRelationship: source, target, type, weight)
 ├── KnowledgeStates[]
 └── Preferences[]

Recommendation
 ├── RecommendationReasons[]
 └── Feedback
```

### 5.2 Event Types Enum

```typescript
enum EventType {
  // Consumption
  CONTENT_CONSUMED    = 'content_consumed',
  CONTENT_OPENED      = 'content_opened',
  CONTENT_COMPLETED   = 'content_completed',
  CONTENT_REPLAYED    = 'content_replayed',
  CONTENT_SKIPPED     = 'content_skipped',
  CONTENT_SAVED       = 'content_saved',
  CONTENT_SHARED      = 'content_shared',
  CONTENT_LIKED       = 'content_liked',
  CONTENT_DISLIKED    = 'content_disliked',

  // Interaction
  SEARCH              = 'search',
  QUESTION            = 'question',
  HIGHLIGHT           = 'highlight',
  ANNOTATION          = 'annotation',

  // Creation
  CREATION            = 'creation',
  EDITING             = 'editing',
  PUBLISHING          = 'publishing',

  // Learning
  LEARNING            = 'learning',

  // Preference
  EXPLICIT_PREFERENCE       = 'explicit_preference',
  RECOMMENDATION_FEEDBACK   = 'recommendation_feedback',
  MODEL_CORRECTION          = 'model_correction',
}
```

### 5.3 Concept Relationship Types

```typescript
enum RelationshipType {
  PART_OF      = 'part_of',
  RELATED_TO   = 'related_to',
  DERIVED_FROM = 'derived_from',
  SIMILAR_TO   = 'similar_to',
  PRECEDES     = 'precedes',
  CONTRADICTS  = 'contradicts',
}
```

### 5.4 Signal Strength Model

```typescript
interface SignalStrength {
  raw_score: number;          // 0.0 – 1.0
  confidence: number;         // 0.0 – 1.0
  recency_weight: number;     // decay factor
  frequency_count: number;
  is_explicit: boolean;       // explicit > implicit
  provenance: string;         // event_id that produced this
  created_at: Date;
  last_updated_at: Date;
}
```

### 5.5 Temporal Decay Model

Preferences decay over time using an exponential decay function:

```
effective_strength = raw_score × e^(-λ × days_since_last_signal)
```

where `λ` (decay rate) is tunable per preference type:
- Stable interests: λ ≈ 0.002 (very slow decay)
- Emerging interests: λ ≈ 0.02
- Temporary signals: λ ≈ 0.1

---

## 6. Database Schema

### Core Tables

```sql
-- ─────────────────────────────────────
-- USERS
-- ─────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    display_name    TEXT,
    avatar_url      TEXT,
    settings        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────
-- EVENTS  (immutable)
-- ─────────────────────────────────────
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    event_type      TEXT NOT NULL,
    source          TEXT NOT NULL,           -- 'web', 'extension', 'mobile', 'api'
    artifact_id     UUID REFERENCES artifacts(id),
    project_id      UUID REFERENCES projects(id),
    context         JSONB NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    confidence      FLOAT NOT NULL DEFAULT 1.0,
    schema_version  INTEGER NOT NULL DEFAULT 1,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_user_id         ON events(user_id);
CREATE INDEX idx_events_occurred_at     ON events(occurred_at DESC);
CREATE INDEX idx_events_event_type      ON events(event_type);
CREATE INDEX idx_events_artifact_id     ON events(artifact_id);

-- ─────────────────────────────────────
-- ARTIFACTS
-- ─────────────────────────────────────
CREATE TYPE artifact_type AS ENUM ('url', 'pdf', 'text', 'image', 'audio', 'video');
CREATE TYPE artifact_status AS ENUM ('pending', 'processing', 'ready', 'failed', 'deleted');

CREATE TABLE artifacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            artifact_type NOT NULL,
    status          artifact_status NOT NULL DEFAULT 'pending',
    title           TEXT,
    source_url      TEXT,
    storage_key     TEXT,                    -- object storage path
    raw_text        TEXT,
    summary         TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    fts_vector      TSVECTOR,               -- full-text search
    is_duplicate    BOOLEAN NOT NULL DEFAULT FALSE,
    canonical_id    UUID REFERENCES artifacts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_artifacts_user_id     ON artifacts(user_id);
CREATE INDEX idx_artifacts_status      ON artifacts(status);
CREATE INDEX idx_artifacts_fts         ON artifacts USING GIN(fts_vector);

CREATE TABLE artifact_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id     UUID NOT NULL REFERENCES artifacts(id),
    version         INTEGER NOT NULL DEFAULT 1,
    raw_text        TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- EMBEDDINGS
-- ─────────────────────────────────────
CREATE TABLE artifact_embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id     UUID NOT NULL REFERENCES artifacts(id),
    chunk_index     INTEGER NOT NULL DEFAULT 0,
    chunk_text      TEXT NOT NULL,
    embedding       VECTOR(1536),            -- OpenAI text-embedding-3-large
    model_version   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_embeddings_artifact    ON artifact_embeddings(artifact_id);
CREATE INDEX idx_embeddings_vec         ON artifact_embeddings USING ivfflat(embedding vector_cosine_ops);

-- ─────────────────────────────────────
-- CONCEPTS
-- ─────────────────────────────────────
CREATE TABLE concepts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    description     TEXT,
    domain          TEXT,
    embedding       VECTOR(1536),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_concepts_slug          ON concepts(slug);
CREATE INDEX idx_concepts_embedding     ON concepts USING ivfflat(embedding vector_cosine_ops);

CREATE TABLE concept_relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES concepts(id),
    target_id       UUID NOT NULL REFERENCES concepts(id),
    type            TEXT NOT NULL,           -- part_of, related_to, derived_from, similar_to
    weight          FLOAT NOT NULL DEFAULT 1.0,
    confidence      FLOAT NOT NULL DEFAULT 1.0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_concept_rel_unique ON concept_relationships(source_id, target_id, type);

CREATE TABLE artifact_concepts (
    artifact_id     UUID NOT NULL REFERENCES artifacts(id),
    concept_id      UUID NOT NULL REFERENCES concepts(id),
    confidence      FLOAT NOT NULL DEFAULT 1.0,
    salience        FLOAT NOT NULL DEFAULT 1.0,
    PRIMARY KEY (artifact_id, concept_id)
);

-- ─────────────────────────────────────
-- KNOWLEDGE GRAPH
-- ─────────────────────────────────────
CREATE TABLE knowledge_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    concept_id      UUID NOT NULL REFERENCES concepts(id),
    strength        FLOAT NOT NULL DEFAULT 0.0,
    confidence      FLOAT NOT NULL DEFAULT 0.0,
    encounter_count INTEGER NOT NULL DEFAULT 0,
    is_explicit     BOOLEAN NOT NULL DEFAULT FALSE,
    last_signal_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, concept_id)
);
CREATE INDEX idx_knowledge_user_id      ON knowledge_states(user_id);

-- ─────────────────────────────────────
-- TASTE GRAPH
-- ─────────────────────────────────────
CREATE TYPE preference_polarity AS ENUM ('positive', 'negative', 'neutral');

CREATE TABLE preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    concept_id      UUID NOT NULL REFERENCES concepts(id),
    polarity        preference_polarity NOT NULL DEFAULT 'positive',
    strength        FLOAT NOT NULL DEFAULT 0.0,
    confidence      FLOAT NOT NULL DEFAULT 0.0,
    signal_count    INTEGER NOT NULL DEFAULT 0,
    is_explicit     BOOLEAN NOT NULL DEFAULT FALSE,
    decay_rate      FLOAT NOT NULL DEFAULT 0.02,
    last_signal_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, concept_id)
);
CREATE INDEX idx_preferences_user_id    ON preferences(user_id);

CREATE TABLE preference_signals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preference_id   UUID NOT NULL REFERENCES preferences(id),
    event_id        UUID NOT NULL REFERENCES events(id),
    delta           FLOAT NOT NULL,          -- change applied (+/-)
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- INTERESTS / CURIOSITY
-- ─────────────────────────────────────
CREATE TYPE interest_type AS ENUM ('stable', 'emerging', 'temporary', 'adjacent');

CREATE TABLE interests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    concept_id      UUID NOT NULL REFERENCES concepts(id),
    type            interest_type NOT NULL DEFAULT 'emerging',
    strength        FLOAT NOT NULL DEFAULT 0.0,
    confidence      FLOAT NOT NULL DEFAULT 0.0,
    last_signal_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, concept_id)
);

-- ─────────────────────────────────────
-- CREATIVE GRAPH
-- ─────────────────────────────────────
CREATE TABLE creative_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    active_domains  JSONB NOT NULL DEFAULT '[]',
    capabilities    JSONB NOT NULL DEFAULT '[]',
    style_signals   JSONB NOT NULL DEFAULT '[]',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE creations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    project_id      UUID REFERENCES projects(id),
    type            TEXT NOT NULL,           -- text, code, image, music, etc.
    title           TEXT,
    content         TEXT,
    storage_key     TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    description     TEXT,
    type            TEXT,                    -- research, music, writing, software, design
    goals           JSONB NOT NULL DEFAULT '[]',
    metadata        JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE project_references (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    artifact_id     UUID REFERENCES artifacts(id),
    concept_id      UUID REFERENCES concepts(id),
    label           TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- DISCOVERY & RECOMMENDATIONS
-- ─────────────────────────────────────
CREATE type recommendation_zone AS ENUM ('comfort', 'adjacent', 'frontier');

CREATE TABLE recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    source_url      TEXT,
    content_type    TEXT,
    zone            recommendation_zone NOT NULL DEFAULT 'adjacent',
    relevance_score FLOAT NOT NULL DEFAULT 0.0,
    novelty_score   FLOAT NOT NULL DEFAULT 0.0,
    final_score     FLOAT NOT NULL DEFAULT 0.0,
    metadata        JSONB NOT NULL DEFAULT '{}',
    shown_at        TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_score   ON recommendations(final_score DESC);

CREATE TABLE recommendation_reasons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id   UUID NOT NULL REFERENCES recommendations(id),
    type                TEXT NOT NULL,   -- 'recent_interest', 'long_term_taste', 'knowledge_gap', 'adjacent_space'
    concept_id          UUID REFERENCES concepts(id),
    artifact_id         UUID REFERENCES artifacts(id),
    explanation         TEXT NOT NULL,   -- user-facing explanation string
    weight              FLOAT NOT NULL DEFAULT 1.0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- FEEDBACK
-- ─────────────────────────────────────
CREATE TYPE feedback_type AS ENUM (
    'like', 'dislike', 'save', 'skip',
    'more_like_this', 'not_interested', 'correction'
);

CREATE TABLE feedbacks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    recommendation_id   UUID REFERENCES recommendations(id),
    artifact_id         UUID REFERENCES artifacts(id),
    type                feedback_type NOT NULL,
    payload             JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- MODEL SNAPSHOTS
-- ─────────────────────────────────────
CREATE TABLE model_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    snapshot        JSONB NOT NULL,          -- denormalized model state
    trigger_event   UUID REFERENCES events(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- AI INFERENCES
-- ─────────────────────────────────────
CREATE TABLE ai_inferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id     UUID REFERENCES artifacts(id),
    event_id        UUID REFERENCES events(id),
    model_name      TEXT NOT NULL,
    model_version   TEXT NOT NULL,
    inference_type  TEXT NOT NULL,           -- 'concept_extraction', 'preference_inference', etc.
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    result          JSONB NOT NULL,
    confidence      FLOAT NOT NULL DEFAULT 1.0,
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 7. API Contracts

### Authentication
All endpoints require `Authorization: Bearer <token>` (JWT). JWTs are issued by the Auth service using short-lived access tokens + refresh tokens.

### Common Response Envelope

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    cursor?: string;
  };
}

interface ApiError {
  code: string;          // machine-readable, e.g. "ARTIFACT_NOT_FOUND"
  message: string;       // human-readable
  details?: Record<string, unknown>;
  request_id: string;
}
```

---

### 7.1 Capture Endpoints

#### `POST /v1/captures`

Create a new capture. Returns immediately with a pending artifact.

**Request body:**
```typescript
{
  type: 'url' | 'pdf' | 'text' | 'image' | 'audio';
  url?: string;                     // for type = url
  text?: string;                    // for type = text
  upload_token?: string;            // pre-signed URL token for file types
  title?: string;
  source?: string;                  // 'web', 'extension', 'share_sheet', 'api'
  project_id?: string;
  context?: Record<string, unknown>;
}
```

**Response `201`:**
```typescript
{
  data: {
    artifact_id: string;
    status: 'pending';
    created_at: string;
  }
}
```

**Idempotency:** Supply `Idempotency-Key` header. Duplicate URL captures within 24h return the existing artifact.

---

#### `GET /v1/captures`

List captures with pagination.

**Query params:** `?page=1&per_page=20&status=ready&type=url`

**Response `200`:**
```typescript
{
  data: Artifact[];
  meta: { page, per_page, total }
}
```

---

#### `GET /v1/captures/:id`

Get a single artifact with full detail including extracted concepts.

```typescript
{
  data: {
    id: string;
    type: string;
    status: string;
    title: string;
    summary: string;
    concepts: Array<{ name: string; confidence: number; }>;
    created_at: string;
  }
}
```

---

#### `DELETE /v1/captures/:id`

Soft-delete an artifact. Triggers `deletion_propagation` job.

---

#### `POST /v1/captures/upload-url`

Request a pre-signed upload URL for file-based captures.

**Request:**
```typescript
{ file_type: 'pdf' | 'image' | 'audio'; filename: string; size_bytes: number; }
```

**Response `200`:**
```typescript
{ upload_url: string; upload_token: string; expires_in: number; }
```

---

### 7.2 Timeline Endpoint

#### `GET /v1/timeline`

Returns a chronological feed of meaningful events and model updates for the user.

**Query params:** `?cursor=<encoded>&limit=20&types[]=content_saved&types[]=model_update`

**Response `200`:**
```typescript
{
  data: Array<{
    id: string;
    type: string;                    // event_type
    title: string;
    description: string;
    artifact?: { id: string; title: string; type: string; };
    concept?: { name: string; };
    occurred_at: string;
  }>;
  meta: { cursor: string; has_more: boolean; }
}
```

---

### 7.3 Discovery Endpoints

#### `GET /v1/discovery`

Returns the personalized discovery feed.

**Query params:** `?zone=adjacent&limit=10&refresh=false`

**Response `200`:**
```typescript
{
  data: Array<{
    id: string;
    title: string;
    description: string;
    source_url: string;
    content_type: string;
    zone: 'comfort' | 'adjacent' | 'frontier';
    relevance_score: number;
    novelty_score: number;
    reasons: Array<{
      type: string;
      explanation: string;          // user-facing: "Because you recently explored X"
      concept?: string;
    }>;
  }>;
}
```

---

#### `POST /v1/discovery/refresh`

Trigger an on-demand discovery refresh (async).

**Response `202`:** `{ job_id: string; }`

---

### 7.4 Feedback Endpoint

#### `POST /v1/feedback`

Submit feedback on a recommendation or artifact.

**Request:**
```typescript
{
  type: 'like' | 'dislike' | 'save' | 'skip' | 'more_like_this' | 'not_interested';
  recommendation_id?: string;
  artifact_id?: string;
  payload?: Record<string, unknown>;
}
```

**Response `201`:**
```typescript
{ data: { feedback_id: string; model_updated: boolean; } }
```

---

### 7.5 Personal Model Endpoints

#### `GET /v1/model`

Returns a user-readable summary of the personal model.

**Response `200`:**
```typescript
{
  data: {
    knowledge: Array<{
      concept: string;
      strength: number;
      confidence: number;
      is_explicit: boolean;
    }>;
    taste: Array<{
      concept: string;
      polarity: 'positive' | 'negative';
      strength: number;
      confidence: number;
      is_explicit: boolean;
    }>;
    interests: Array<{
      concept: string;
      type: 'stable' | 'emerging' | 'temporary' | 'adjacent';
      strength: number;
    }>;
    creative: {
      active_domains: string[];
      capabilities: string[];
      style_signals: string[];
    };
    last_updated: string;
  }
}
```

---

#### `PATCH /v1/model/inferences/:concept_id`

Apply a user correction to a model inference.

**Request:**
```typescript
{
  action: 'remove' | 'strengthen' | 'weaken' | 'mark_temporary' | 'correct_polarity';
  polarity?: 'positive' | 'negative';
  notes?: string;
}
```

**Response `200`:** Updated model node.

---

### 7.6 Project Endpoints

#### `POST /v1/projects`

```typescript
// Request
{ name: string; type: string; description?: string; goals?: string[]; }

// Response 201
{ data: Project }
```

#### `GET /v1/projects`
#### `GET /v1/projects/:id`
#### `PATCH /v1/projects/:id`
#### `DELETE /v1/projects/:id`

#### `POST /v1/projects/:id/references`

Add an artifact or concept reference to a project.

```typescript
{ artifact_id?: string; concept_id?: string; label?: string; notes?: string; }
```

---

## 8. Event System

### 8.1 Event Schema (versioned)

```typescript
interface SynoraEvent {
  event_id: string;           // UUID v4
  schema_version: number;     // currently 1
  user_id: string;
  event_type: EventType;
  source: string;             // 'web' | 'extension' | 'mobile' | 'api'
  artifact_id?: string;
  project_id?: string;
  occurred_at: string;        // ISO 8601
  context: {
    session_id?: string;
    device_type?: string;
    referrer?: string;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
  confidence: number;         // 0.0 – 1.0
}
```

### 8.2 Event Processing Rules

| Rule | Implementation |
|---|---|
| Idempotent | Events deduplicated by `(user_id, event_type, artifact_id, occurred_at ± 5s)` |
| Immutable | Events are insert-only. Corrections are new `model_correction` events |
| Out-of-order safe | Workers sort by `occurred_at` before model updates |
| Offline-first | Client queues locally; syncs with `occurred_at` preserved |
| Schema-versioned | `schema_version` field enables backward-compatible migrations |
| Deletion | `deletion_propagation` job cascades through embeddings, inferences, model |

### 8.3 Event → Queue Mapping

```
capture submitted         → content_extraction job
content extracted         → semantic_analysis job
semantic analysis done    → model_update job
model updated             → recommendation_refresh job (debounced 15m)
feedback received         → model_update job (immediate)
artifact deleted          → deletion_propagation job
```

---

## 9. Inference Pipeline

### 9.1 Full Pipeline

```
RAW INPUT (URL / PDF / text / audio / image)
         ↓
[1] NORMALIZATION
    - Validate schema
    - Deduplicate
    - Assign artifact_id
         ↓
[2] CONTENT EXTRACTION
    - URL: fetch HTML → readability extraction
    - PDF: Azure Doc Intelligence → text + structure
    - Audio: Whisper STT → transcript
    - Image: multimodal LLM → description
    - Chunking: 512-token overlapping chunks
         ↓
[3] EMBEDDING
    - Embed each chunk (text-embedding-3-large)
    - Store in artifact_embeddings
    - Upsert to pgvector index
         ↓
[4] CONCEPT EXTRACTION (LLM-powered)
    Prompt: extract named concepts, entities, topics
    Output:
    [
      { name: "Attention Mechanism", confidence: 0.95, domain: "ML" },
      { name: "Transformer Architecture", confidence: 0.88, domain: "ML" }
    ]
    - Upsert to concepts table
    - Link via artifact_concepts
         ↓
[5] RELATIONSHIP EXTRACTION
    - Identify concept-to-concept relationships from the content
    - Upsert to concept_relationships with weight and confidence
         ↓
[6] PREFERENCE SIGNAL DETECTION
    - Content polarity (positive/negative framing)
    - Behavioral signal (saved = positive, skipped = negative)
    - Explicit signal (liked/disliked)
    - Domain classification
         ↓
[7] CONTEXT RESOLUTION
    - Load user's existing personal model
    - Weight new signal against existing model state
    - Determine if signal is temporary/emerging/stable
         ↓
[8] CONFIDENCE SCORING
    - Source quality weight
    - Extraction model confidence
    - Signal strength
    - Historical consistency
         ↓
[9] PERSONAL MODEL UPDATE
    - Upsert knowledge_states
    - Upsert preferences
    - Upsert interests
    - Update creative_state if applicable
    - Record model_snapshot
    - Emit events
```

### 9.2 LLM Prompt Structure for Concept Extraction

```
System:
You extract knowledge concepts from text for a personal intelligence system.
Return only structured JSON, no prose.

User:
TEXT: {chunk_text}

Extract all meaningful concepts, entities, and topics.
For each, output:
- name: canonical name
- confidence: 0.0-1.0
- domain: broad domain (ML, Music, Design, etc.)
- relationships: list of related concepts found in this text

Return JSON array.
```

### 9.3 AI Adapter Pattern

All AI calls go through an adapter interface. Providers are swappable without changing pipeline logic.

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  dimensions: number;
  modelVersion: string;
}

interface LLMProvider {
  complete(prompt: LLMPrompt): Promise<LLMResponse>;
  modelName: string;
}

interface TranscriptionProvider {
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<string>;
}

interface DocumentParser {
  parse(fileBuffer: Buffer, mimeType: string): Promise<ParsedDocument>;
}
```

---

## 10. Personal Model System

### 10.1 Three-Graph Architecture

```
┌─────────────────────────────────────────────┐
│              PERSONAL MODEL                  │
│                                              │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ KNOWLEDGE   │  │ TASTE GRAPH          │  │
│  │ GRAPH       │  │                      │  │
│  │             │  │ positive ──── concept │  │
│  │ concept ←──►│  │ negative ──── concept │  │
│  │    │        │  │ strength              │  │
│  │  strength   │  │ polarity              │  │
│  │  confidence │  │ confidence            │  │
│  └──────┬──────┘  └───────────┬───────────┘  │
│         │                      │              │
│         ▼                      ▼              │
│  ┌──────────────────────────────────────┐    │
│  │        CREATIVE GRAPH                │    │
│  │  capabilities · projects · outputs   │    │
│  │  style_signals · creative_domains    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│              TEMPORAL LAYER                  │
│  All nodes carry: strength, confidence,      │
│  decay_rate, last_signal_at, created_at      │
└─────────────────────────────────────────────┘
```

### 10.2 Model Update Algorithm

```typescript
async function updatePersonalModel(
  userId: string,
  inferenceResult: InferenceResult
): Promise<void> {
  // 1. Upsert knowledge states
  for (const concept of inferenceResult.concepts) {
    await upsertKnowledgeState({
      userId,
      conceptId: concept.id,
      delta: concept.salience * concept.confidence,
    });
  }

  // 2. Upsert preferences
  if (inferenceResult.preferenceSignal) {
    await upsertPreference({
      userId,
      conceptId: inferenceResult.preferenceSignal.conceptId,
      polarity: inferenceResult.preferenceSignal.polarity,
      delta: inferenceResult.preferenceSignal.strength,
      isExplicit: inferenceResult.isExplicit,
    });
  }

  // 3. Classify interest type
  for (const interest of inferenceResult.interests) {
    const history = await getInterestHistory(userId, interest.conceptId);
    const type = classifyInterestType(history);
    await upsertInterest({ userId, conceptId: interest.conceptId, type });
  }

  // 4. Snapshot model state
  await createModelSnapshot(userId, inferenceResult.eventId);
}
```

### 10.3 Model Inspectability API (Internal)

The Model service exposes an internal model summary used both by the discovery engine and the frontend inspection UI:

```typescript
interface PersonalModelSummary {
  userId: string;
  generatedAt: Date;
  knowledge: KnowledgeNode[];       // sorted by strength desc
  taste: TasteNode[];               // positive + negative
  interests: InterestNode[];        // stable, emerging, temporary
  creative: CreativeStateSummary;
  recentActivity: string[];         // concept names from last 7 days
  modelVersion: number;
}
```

---

## 11. Discovery Engine

### 11.1 Discovery Pipeline

```
TRIGGER (scheduled or on-demand)
         ↓
[1] LOAD PERSONAL MODEL
    - Top-N knowledge concepts (by strength)
    - Top-N taste preferences (positive + negative)
    - Emerging interests (last 14 days)
    - Curiosity signals (frequent searches/questions)
         ↓
[2] CANDIDATE RETRIEVAL
    Strategy A: Vector similarity
      - Query pgvector with user interest embeddings
      - Retrieve similar artifact chunks not yet seen
    Strategy B: External discovery (V1+)
      - Web search / external enrichment APIs
         ↓
[3] SCORING
    Each candidate scored on:
    - Relevance score = cosine_similarity(candidate, user_model)
    - Novelty score = 1 - max_overlap(candidate, user_history)
    - Zone classification:
        comfort   → high relevance, low novelty (score ≥ 0.8)
        adjacent  → medium relevance, medium novelty (0.4–0.8)
        frontier  → low relevance, high novelty (< 0.4)

    Final score = (relevance_weight × relevance) + (novelty_weight × novelty)
    Weights configurable per user exploration setting.
         ↓
[4] NEGATIVE FILTERING
    - Remove disliked concepts
    - Remove "not_interested" tagged content
    - Remove recently shown items (deduplication window: 30 days)
         ↓
[5] REASON GENERATION (LLM)
    Generate 2–3 user-facing explanation strings per recommendation:
    "Because you recently explored Transformer Architecture"
    "You haven't explored this area yet but it connects to Attention Mechanisms"
         ↓
[6] PERSIST
    - Write to recommendations table
    - Write reasons to recommendation_reasons
         ↓
[7] RETURN
    Ranked, explainable recommendation list
```

### 11.2 Exploration Zones

```
                    ┌────────────────────────────────┐
                    │  COMFORT ZONE                   │
                    │  High relevance, low novelty    │
                    │  "More of what you love"        │
                    ├────────────────────────────────┤
                    │  ADJACENT ZONE  (default)       │
                    │  Related but new direction      │
                    │  "Stretch your taste"           │
                    ├────────────────────────────────┤
                    │  FRONTIER ZONE                  │
                    │  Unexplored territory           │
                    │  "Surprise yourself"            │
                    └────────────────────────────────┘
```

Default exploration ratio: 40% comfort / 45% adjacent / 15% frontier. User-configurable.

---

## 12. Queue & Worker Architecture

### 12.1 Job Types

| Job | Priority | Max Retries | Timeout |
|---|---|---|---|
| `content_extraction` | high | 3 | 60s |
| `semantic_analysis` | high | 3 | 90s |
| `model_update` | high | 5 | 30s |
| `embedding_refresh` | medium | 3 | 120s |
| `recommendation_refresh` | medium | 2 | 60s |
| `notification_send` | medium | 3 | 10s |
| `deletion_propagation` | low | 10 | 30s |

### 12.2 Queue Configuration (BullMQ)

```typescript
const queues = {
  capture: new Queue('capture', { connection: redis }),
  inference: new Queue('inference', { connection: redis }),
  model: new Queue('model', { connection: redis }),
  discovery: new Queue('discovery', { connection: redis }),
  deletion: new Queue('deletion', { connection: redis }),
  notifications: new Queue('notifications', { connection: redis }),
};

// Concurrency per queue
const workers = {
  capture: new Worker('capture', captureProcessor, { concurrency: 5 }),
  inference: new Worker('inference', inferenceProcessor, { concurrency: 3 }),
  model: new Worker('model', modelProcessor, { concurrency: 5 }),
  discovery: new Worker('discovery', discoveryProcessor, { concurrency: 2 }),
  deletion: new Worker('deletion', deletionProcessor, { concurrency: 2 }),
};
```

### 12.3 Dead-Letter Queue

Failed jobs (after all retries exhausted) move to a dead-letter queue:
- Logged with full job data and failure reason
- Alert fired via Sentry
- Manual retry UI available in internal admin
- DLQ entries retained for 30 days

### 12.4 Deletion Propagation Job

The `deletion_propagation` job ensures no orphaned data remains:

```
1. Soft-delete artifact record
2. Remove artifact_embeddings from pgvector index
3. Remove artifact_concepts links
4. Propagate to knowledge_states (reduce encounter_count)
5. Propagate to preference_signals
6. Remove from fts_vector index
7. Expire cached model summaries
8. Mark related recommendations as expired
9. Delete object storage file
10. Log audit event
```

---

## 13. AI & Inference Layer

### 13.1 Provider Matrix

| Function | MVP Provider | Fallback | Adapter |
|---|---|---|---|
| Embeddings | OpenAI `text-embedding-3-large` | Cohere / local model | `EmbeddingProvider` |
| LLM Reasoning | OpenAI GPT-4o | Anthropic Claude | `LLMProvider` |
| Document Parsing | Azure Document Intelligence | Tesseract + `pdf-parse` | `DocumentParser` |
| Speech-to-Text | OpenAI Whisper API | Deepgram | `TranscriptionProvider` |
| Image Understanding | GPT-4o Vision | Google Gemini | `VisionProvider` |

### 13.2 Cost Control

- All AI calls are rate-limited per user tier
- Embeddings cached for identical content (hash-based dedup)
- LLM calls batched where possible
- Token usage tracked per `ai_inferences` record
- Hard limits enforced in worker (reject job if over budget)

### 13.3 Model Versioning

Every AI inference records:
```typescript
{
  model_name: 'gpt-4o',
  model_version: '2025-01',
  inference_type: 'concept_extraction',
  result: { ... },               // full output stored
  created_at: ...,
}
```

When a model changes, historical inferences remain intact. New captures use the new model. Backfill jobs can re-process old artifacts with new models if needed.

---

## 14. Infrastructure & Deployment

### 14.1 Service Topology

```
┌──────────────────────────────────────────────────┐
│                  DOCKER COMPOSE (local dev)       │
│                                                    │
│  api-service        :3000                         │
│  worker-service     (no port, queue consumer)     │
│  postgres           :5432                         │
│  redis              :6379                         │
│  minio              :9000  (S3-compatible local)  │
└──────────────────────────────────────────────────┘
```

### 14.2 Production (Kubernetes)

```
Deployments:
  - synora-api          (3 replicas, HPA)
  - synora-worker       (2 replicas, HPA by queue depth)
  - synora-scheduler    (1 replica, discovery refresh cron)

Services:
  - PostgreSQL          (managed: Supabase / Neon / RDS)
  - Redis               (managed: Upstash / ElastiCache)
  - Object Storage      (Cloudflare R2 / AWS S3)

Ingress:
  - NGINX Ingress Controller
  - TLS via cert-manager (Let's Encrypt)
  - Rate limiting at ingress level
```

### 14.3 Environment Variables

```
# App
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.synora.app

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Object Storage
STORAGE_PROVIDER=r2
STORAGE_BUCKET=synora-artifacts
STORAGE_ENDPOINT=https://...r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...

# Auth
JWT_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# AI Providers
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=...
AZURE_DOCUMENT_INTELLIGENCE_KEY=...

# Observability
SENTRY_DSN=...
OTEL_EXPORTER_OTLP_ENDPOINT=...
```

### 14.4 Scaling Strategy

| Bottleneck | Strategy |
|---|---|
| Inference throughput | Scale worker replicas horizontally |
| Vector search latency | Add IVFFlat index partitions; shard by user at high scale |
| API throughput | Horizontal scale behind load balancer |
| DB connections | PgBouncer connection pooling |
| Queue depth | Auto-scale workers by queue metric |
| Object storage | CDN in front of R2/S3 |

---

## 15. Security Architecture

### 15.1 Authentication Flow

```
User → Login → Auth Service → Access Token (15m) + Refresh Token (30d)
     → API Request → Validate JWT → Extract user_id → Row-level enforcement
     → Token Expiry → Refresh Token → New Access Token
```

### 15.2 Authorization Layers

1. **API Level** — JWT required for all endpoints
2. **Service Level** — Services verify `user_id` matches resource owner
3. **Database Level** — Row-level security (RLS) enforced where applicable
4. **AI Provider Level** — User data stripped of PII before sending to third-party models where feasible

### 15.3 Data Protection

- All data encrypted in transit (TLS 1.3+)
- Database at-rest encryption enabled (managed DB)
- Object storage files encrypted at rest (AES-256)
- PII fields (email, display_name) separately encrypted at the application layer
- AI providers configured with no-training agreements

### 15.4 Source Permissions Model

```typescript
interface SourcePermission {
  sourceType: 'browser_extension' | 'share_sheet' | 'api_key';
  isEnabled: boolean;
  captureTypes: ('url' | 'pdf' | 'text' | 'image' | 'audio')[];
  consentGrantedAt: Date;
  consentRevokedAt?: Date;
}
```

Users explicitly enable each capture source. Revoking a source triggers deletion of all data from that source if the user requests it.

---

## 16. Observability

### 16.1 Structured Logging (Pino)

Every log entry includes:
```json
{
  "level": "info",
  "time": "2025-01-01T00:00:00Z",
  "service": "api",
  "request_id": "uuid",
  "user_id": "uuid",
  "trace_id": "otel-trace-id",
  "msg": "capture created",
  "artifact_id": "uuid",
  "duration_ms": 45
}
```

### 16.2 OpenTelemetry Traces

Key spans traced:
- HTTP request lifecycle
- Queue job enqueue + dequeue + process
- AI provider call (latency, token count)
- Database queries (slow query threshold: 100ms)
- Cache hits/misses

### 16.3 Key Metrics

| Metric | Description |
|---|---|
| `captures.created.count` | Total captures per minute |
| `inference.latency.p95` | 95th percentile pipeline latency |
| `model.update.count` | Model updates per user per day |
| `discovery.score.mean` | Mean final recommendation score |
| `feedback.acceptance_rate` | Like / (Like + Dislike) per period |
| `queue.depth.<name>` | Jobs pending per queue |
| `worker.failure_rate` | Job failure rate per queue |
| `ai.tokens.count` | Token consumption by provider |

### 16.4 Alerting Thresholds (MVP)

| Alert | Condition |
|---|---|
| High queue depth | `queue.depth.capture > 100` for 5m |
| Inference failure spike | `worker.failure_rate > 0.05` for 5m |
| AI provider latency | `ai.latency.p99 > 10s` for 3m |
| DB connections exhausted | `pg_connections > 80%` |
| DLQ size growing | DLQ `> 20` entries |

---

## 17. Frontend Architecture

### 17.1 Application Structure

```
src/
├── app/
│   ├── router.tsx
│   ├── providers.tsx       (QueryClient, Zustand, Auth)
│   └── App.tsx
├── pages/
│   ├── Home/
│   ├── Capture/
│   ├── Timeline/
│   ├── Discovery/
│   ├── Model/
│   ├── Projects/
│   └── Settings/
├── components/
│   ├── capture/
│   ├── discovery/
│   ├── model/
│   ├── timeline/
│   └── shared/
├── hooks/
│   ├── useCapture.ts
│   ├── useDiscovery.ts
│   ├── usePersonalModel.ts
│   └── useFeedback.ts
├── stores/
│   └── uiStore.ts          (Zustand: local UI state)
├── api/
│   └── client.ts           (typed API client, TanStack Query)
├── types/
│   └── api.ts
└── styles/
    ├── tokens.css
    └── global.css
```

### 17.2 State Architecture

**Server state** (TanStack Query):
- `/v1/captures` → `useCaptures()`
- `/v1/discovery` → `useDiscovery()`
- `/v1/model` → `usePersonalModel()`
- `/v1/timeline` → `useTimeline()`
- `/v1/projects` → `useProjects()`

**Local UI state** (Zustand):
- Active capture modal state
- Filter/tab selections
- Optimistic feedback state

### 17.3 Offline Capture (PWA / Mobile)

For mobile and PWA:
- Captures queue in IndexedDB when offline
- Service Worker syncs queue when connectivity resumes
- `occurred_at` is preserved from original capture time
- Server deduplicates on `Idempotency-Key` derived from content hash + timestamp

### 17.4 Design Tokens

```css
:root {
  /* Color */
  --color-surface-base: #0d0e12;
  --color-surface-raised: #15171e;
  --color-surface-overlay: #1d2029;
  --color-text-primary: #f0f0f4;
  --color-text-secondary: #8a8d9e;
  --color-text-tertiary: #555868;
  --color-accent: #6366f1;        /* indigo */
  --color-accent-subtle: #6366f120;
  --color-success: #22d3a0;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Radius */
  --radius-sm: 6px; --radius-md: 10px;
  --radius-lg: 16px; --radius-xl: 24px;

  /* Motion */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 350ms;
}
```

---

## 18. MVP Build Order

Following the PRD recommended sequence, with engineering dependencies considered:

### Phase 0 — Foundation (Week 1–2)
- [ ] Monorepo setup (pnpm workspaces: `apps/api`, `apps/web`, `packages/shared`)
- [ ] NestJS API skeleton with Fastify adapter
- [ ] PostgreSQL + migrations (Prisma or Drizzle ORM)
- [ ] Redis connection
- [ ] Auth module (JWT access + refresh tokens)
- [ ] BullMQ queue setup
- [ ] Vite + React frontend scaffold
- [ ] Design tokens + global styles
- [ ] Docker Compose for local dev

### Phase 1 — Capture Pipeline (Week 3–5)
- [ ] Capture API endpoints
- [ ] Pre-signed upload URL flow (object storage)
- [ ] URL fetch + Readability extraction worker
- [ ] PDF extraction worker (Azure Doc Intelligence)
- [ ] Text capture worker
- [ ] Concept extraction (LLM) worker
- [ ] Embedding generation + pgvector storage
- [ ] Artifact concepts linking
- [ ] Capture UI (URL input, PDF upload, text paste)
- [ ] Processing state feedback (instant confirm + async indicator)

### Phase 2 — Personal Model (Week 6–8)
- [ ] Knowledge state upsert logic
- [ ] Preference inference from capture signals
- [ ] Interest classification (stable/emerging/temporary)
- [ ] Model snapshot recording
- [ ] Personal model API endpoint
- [ ] Model inspection UI (concept list, strength, confidence)
- [ ] User correction API + UI
- [ ] Timeline API + UI

### Phase 3 — Discovery (Week 9–11)
- [ ] Discovery scoring algorithm
- [ ] Candidate retrieval (vector similarity)
- [ ] Reason generation (LLM)
- [ ] Exploration zone classification
- [ ] Discovery feed API
- [ ] Feedback API
- [ ] Discovery UI with explanations
- [ ] Feedback UI (like, dislike, more like this, not interested)
- [ ] Scheduled recommendation refresh (daily)

### Phase 4 — Privacy & Polish (Week 12–13)
- [ ] Deletion propagation job
- [ ] Privacy screen (data export, deletion controls)
- [ ] Audit log
- [ ] Settings screen
- [ ] Notification framework (basic)
- [ ] Performance optimization
- [ ] E2E test: capture → inference → model → discovery → feedback

### Phase 5 — Stabilization (Week 14)
- [ ] Load testing
- [ ] Error handling audit
- [ ] Dead-letter queue monitoring
- [ ] Observability dashboards
- [ ] Security review
- [ ] Soft launch (internal)

---

## Appendix A — Monorepo Structure

```
synora/
├── apps/
│   ├── api/                 (NestJS backend)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── capture/
│   │   │   │   ├── inference/
│   │   │   │   ├── model/
│   │   │   │   ├── discovery/
│   │   │   │   ├── projects/
│   │   │   │   └── worker/
│   │   │   ├── providers/
│   │   │   │   ├── ai/
│   │   │   │   │   ├── embedding.provider.ts
│   │   │   │   │   ├── llm.provider.ts
│   │   │   │   │   ├── stt.provider.ts
│   │   │   │   │   └── document.provider.ts
│   │   │   │   ├── storage/
│   │   │   │   └── queue/
│   │   │   └── main.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/                 (React + Vite frontend)
│       ├── src/
│       └── index.html
├── packages/
│   └── shared/              (shared TypeScript types)
│       ├── types/
│       └── schemas/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## Appendix B — Key Decisions Log

| Decision | Rationale |
|---|---|
| PostgreSQL over dedicated graph DB | Sufficient for MVP graph queries; pgvector covers semantic search; avoids operational complexity |
| BullMQ over Kafka | Simpler at MVP scale; Redis already required; Kafka path available if throughput exceeds BullMQ limits |
| NestJS over plain Fastify | Module system enforces domain boundaries; DI container simplifies provider swapping |
| Events as immutable | Enables audit, provenance, and correction without data corruption |
| Adapter pattern for all AI providers | Allows model swapping without touching domain logic; critical given rapid AI landscape changes |
| pgvector over Pinecone/Weaviate | Co-locates vectors with relational data; simplifies deletion propagation; sufficient for MVP scale |
| Soft deletes for artifacts | Derived model state must remain consistent during deletion propagation; hard delete after propagation confirmed |

---

*Document version: 1.0 · Last updated: 2026-08-11*
