# Personal Intelligence and Creativity OS - Product Requirements Document

## 1. Product Summary

Build an AI-native personal intelligence layer that learns from a person's digital life, continuously updates a personal model, and uses that model to improve both understanding and creative exploration.

This product combines three connected systems:

- Personal intelligence: what the user knows, is learning, is exploring, and cares about.
- Taste intelligence: what the user likes, dislikes, avoids, and how those preferences evolve.
- Creative intelligence: what the user creates, can create, and should explore next.

The system is event-driven. Every meaningful interaction becomes a signal, the signal updates the personal model, and the updated model changes what the system does next.

## 2. Product Vision

The product is not a notes app, productivity app, or generic AI generator. It is a continuously learning personal model that can answer:

- What does this person know?
- What are they curious about?
- What do they like and why?
- How is their taste changing?
- What should they discover next?
- What can they create that they would not have produced alone?

The product should understand the trajectory of the user's mind, not just the archive of their history.

## 3. Product Mission

Help people turn their digital life into a system that learns from them, reflects their evolving interests, and supports better discovery and creation.

## 4. Product Thesis

> Capture meaningful interactions.
> Interpret them in context.
> Update a personal model.
> Recommend or create something useful.
> Learn from the user's reaction.

The product succeeds if it becomes more relevant, more accurate, and more creatively useful over time.

## 5. Target Users

### Primary users

- Curious knowledge workers
- Builders and creators
- Researchers, designers, writers, musicians, and developers
- Users with broad interests who save and revisit a lot of content

### Secondary users

- People who want a smarter second brain
- People who want better personalized discovery
- Creators who want project-aware AI support

## 6. Core User Problems

1. Information is fragmented across browser tabs, files, chats, screenshots, saved links, and media apps.
2. Generic AI tools do not know what a user knows, likes, or is trying to become.
3. Recommendation systems suggest more of the same, not meaningful expansion.
4. Creative tools produce outputs without understanding the user's taste or context.
5. People cannot easily see how their interests and preferences change over time.

## 7. Product Promise

Build an AI that understands you.

More specifically:

- The more you learn, explore, and create, the better the system understands you.
- The better it understands you, the more useful its discovery and creative support become.

## 8. Product Principles

- Personal model first, features second.
- Every signal should change something useful.
- Explanation matters more than opaque personalization.
- Capture must be low friction.
- Discovery should be useful before it is impressive.
- Exploration should stretch taste without feeling random.
- Privacy and deletion must be first-class.
- The product must stay focused and avoid becoming an AI app that does everything.

## 9. What the Product Is Not

- Not a generic productivity suite
- Not a task manager
- Not a chat-only assistant
- Not a social feed
- Not an all-purpose content generator
- Not a replacement for every note-taking or creative tool

## 10. Primary Use Cases

- Save an article, PDF, image, or idea and have it become part of the user's model.
- Receive a personalized discovery feed based on recent activity and long-term taste.
- Ask for ideas that connect current learning with prior interests.
- Explore adjacent creative spaces outside the user's usual taste.
- Review and correct what the system believes about the user.

## 11. Secondary Use Cases

- Build a project-specific memory for a creative or research project.
- Search across prior captures and inferred concepts.
- Use the system as a collaborator for brainstorming and concept development.
- Track how interests, knowledge, and taste evolve over time.

## 12. Core Product Loop

```text
Capture
  -> Understand
  -> Interpret
  -> Update Personal Model
  -> Reason
  -> Recommend or Create
  -> User Reacts
  -> Learn
  -> Improve Personal Model
```

### Why each stage exists

- Capture: collect user signals with minimal friction through three modes: explicit capture, where the user intentionally saves something; assisted capture, where the system helps with a connected source such as a browser extension or share sheet; and passive capture, where the system only observes pre-approved signals and always stays within consent boundaries.
- Understand: extract content, entities, concepts, and attributes.
- Interpret: convert raw inputs into meaning in context.
- Update Personal Model: store evolving knowledge, taste, and creative state.
- Reason: choose the most relevant next action.
- Recommend or Create: provide discovery or creative output.
- User Reacts: collect implicit and explicit feedback.
- Learn: use reactions to improve future behavior.

## 13. Product Architecture Overview

The product is organized into six major domains:

1. Capture System
2. Event and Inference Pipeline
3. Personal Model System
4. Discovery and Exploration System
5. Creative and Project System
6. Frontend, Security, and Platform Systems

## 14. MVP Scope

The MVP should focus on browser and PDF capture plus explainable discovery for knowledge workers.

### MVP includes

- Explicit URL capture
- Explicit PDF capture
- Basic text capture
- Assisted browser extension capture for one-click save from the source page
- Assisted share-sheet capture where supported
- Consent-based passive capture only for connected sources and only when the user has explicitly enabled them
- Semantic extraction
- Personal knowledge and taste model
- Daily or weekly discovery feed
- Explainable recommendation reasons
- Feedback on recommendations
- Lightweight timeline of captures and model updates

### MVP excludes

- Music generation
- Image generation
- Full mobile sensor capture
- Complex agent orchestration
- Social features
- Full collaboration features
- Deep project management

## 15. V1 Scope

Add creation support.

### V1 includes

- Create-from-context flow
- Project workspace
- Saved references and source linking
- Prompting based on the user's personal model
- Text and concept generation

## 16. V2 Scope

Add deliberate taste exploration.

### V2 includes

- Taste boundary modeling
- Adjacent-space exploration
- Novelty scoring
- Exploration-versus-comfort balancing
- Feedback-based taste evolution

## 17. V3 Scope

Add project-specific creative agents.

### V3 includes

- Contextual project collaboration
- Better cross-domain reasoning
- Long-running project memory
- Cross-modal creative assistance
- Rich exports

## 18. Functional Requirement Format

Each requirement uses the format:

- Requirement ID
- Requirement
- User story
- Trigger
- Inputs
- Processing
- Expected output
- Failure behavior
- Priority
- Dependencies

## 19. Capture System Requirements

### FR-CAP-001 - URL Capture

The system must allow a user to capture a URL from the browser or share sheet with one action.

- User story: As a user, I want to save a useful page quickly so it becomes part of my personal model.
- Trigger: User clicks save or shares a URL into the app.
- Inputs: URL, optional page title, source app, timestamp.
- Processing: Create an artifact, fetch page metadata, queue content extraction.
- Output: Saved item in capture timeline with processing state.
- Failure behavior: If fetching fails, store the URL and retry extraction later.
- Priority: High
- Dependencies: Auth, source ingestion, metadata fetch, queue worker.

### FR-CAP-002 - PDF Capture

The system must accept PDFs and extract readable text and structure.

- Inputs: Uploaded file, filename, page count, source.
- Processing: Virus scan, text extraction, OCR if needed, semantic chunking.
- Output: Searchable artifact linked to original file.
- Failure behavior: If extraction fails, mark the artifact incomplete and allow retry.
- Priority: High
- Dependencies: Object storage, OCR, document parser.

### FR-CAP-003 - Text Capture

The system must allow the user to paste or type text as a capture event.

- Inputs: Plain text, optional tags, optional context.
- Processing: Normalize, classify, extract concepts, link to existing model.
- Output: Stored event and searchable note artifact.
- Priority: Medium

### FR-CAP-004 - Capture Feedback

The system must acknowledge capture immediately with a visible success state and not wait for AI processing.

- User-visible behavior: instant confirmation, then background processing indicator.
- Failure behavior: surface retry if background processing fails.
- Priority: High

## 20. Event Model Requirements

### Event types

- content_consumed
- content_opened
- content_completed
- content_replayed
- content_skipped
- content_saved
- content_shared
- content_liked
- content_disliked
- search
- question
- highlight
- annotation
- creation
- editing
- publishing
- learning
- explicit_preference
- recommendation_feedback

### Required event fields

- event_id
- user_id
- event_type
- source
- artifact_id
- timestamp
- context
- metadata
- confidence
- schema_version

### Event rules

- Events must be idempotent.
- Duplicate captures must be merged when possible.
- Out-of-order events must not corrupt temporal state.
- Deleted events must be removed from downstream indexes and derived state.
- Event schemas must be versioned.
- Offline events must queue locally and sync later.

## 21. Inference Pipeline Requirements

### FR-INF-001 - Normalize Input

The system must normalize raw inputs into a shared event schema before any higher-order reasoning.

### FR-INF-002 - Extract Content

The system must extract text, structure, and media metadata from raw content.

### FR-INF-003 - Extract Concepts

The system must infer concepts, entities, topics, and relationships from captured content.

### FR-INF-004 - Detect Preference Signals

The system must detect explicit and implicit preference signals from user behavior.

### FR-INF-005 - Score Confidence

The system must assign a confidence score to every inferred attribute.

### FR-INF-006 - Resolve Context

The system must use recent history and existing model state to resolve ambiguous signals.

### FR-INF-007 - Update Personal Model

The system must update knowledge, taste, curiosity, and creative state from the inference output.

## 22. Personal Model Requirements

The personal model is the core product asset. It must be persistent, time-aware, inspectable, and editable.

### Model components

- Knowledge graph
- Taste graph
- Creative graph
- Curiosity state
- Temporal state
- Confidence state
- Recommendation history
- Feedback history
- Model snapshots

### Personal model behavior

- The model must preserve both current state and historical state.
- The model must support explicit user corrections.
- The model must support temporary interests and project-specific interests.
- The model must distinguish between explicit knowledge and inferred knowledge.

## 23. Knowledge Graph Requirements

The knowledge graph represents what the user knows and how concepts relate.

### FR-KNW-001 - Concept Tracking

The system must store concepts the user has interacted with and the strength of those concepts in the knowledge model.

### FR-KNW-002 - Relationship Tracking

The system must connect concepts through semantic relationships such as part-of, related-to, derived-from, and similar-to.

### FR-KNW-003 - Knowledge Confidence

The system must store confidence for knowledge claims and weaken claims when contradictory evidence appears.

### FR-KNW-004 - Knowledge Gaps

The system must detect areas that are adjacent to known topics but not yet well understood by the user.

## 24. Taste Graph Requirements

The taste graph represents what the user likes, dislikes, and how those preferences evolve.

### FR-TST-001 - Preference Tracking

The system must track preference signals with strength, recency, frequency, and confidence.

### FR-TST-002 - Preference Evolution

The system must model changing taste over time rather than treating preferences as static facts.

### FR-TST-003 - Contradictory Signals

The system must resolve contradictory signals by weighting explicit feedback more strongly than passive behavior.

### FR-TST-004 - Taste Boundaries

The system must identify comfort, adjacent, and frontier zones for exploration.

## 25. Creative Graph Requirements

The creative graph represents what the user creates and what they are capable of creating.

### FR-CRT-001 - Creation Tracking

The system must store creations, projects, ideas, and outputs as part of the creative model.

### FR-CRT-002 - Capability Inference

The system must infer creative capabilities from repeated creation patterns and project history.

### FR-CRT-003 - Project Context

The system must allow creative state to be scoped to a project when appropriate.

### FR-CRT-004 - Creative Suggestions

The system must use knowledge, taste, and creative history to propose useful creative directions.

## 26. Discovery Engine Requirements

### FR-DIS-001 - Personalized Ranking

The system must rank discoveries using recent interest, long-term taste, knowledge, curiosity, novelty, and negative preference signals.

### FR-DIS-002 - Explainable Recommendations

The system must store reasoning signals so the UI can explain why each recommendation was made.

### FR-DIS-003 - Schedule-Based and On-Demand Discovery

The system must support both scheduled discovery feeds and user-triggered discovery requests.

### FR-DIS-004 - Novelty Control

The system must balance relevance and novelty so recommendations do not become repetitive.

## 27. Exploration Engine Requirements

### FR-EXP-001 - Comfort / Adjacent / Frontier Zones

The system must classify potential suggestions into comfort, adjacent, or frontier zones.

### FR-EXP-002 - Exploration Ratio

The system must support a configurable mix of familiar, adjacent, and experimental suggestions.

### FR-EXP-003 - Feedback-Based Expansion

The system must increase or decrease exploration based on how the user reacts to novel suggestions.

## 28. Creative Intelligence Requirements

### FR-CRT-101 - Create From Context

The system must support prompts like "create something based on what I have been exploring."

### FR-CRT-102 - Cross-Domain Synthesis

The system must generate ideas by combining knowledge, taste, and previous creations.

### FR-CRT-103 - Output Formats

The system must return output in a format appropriate to the target modality, such as text outline, concept list, or draft prompt.

## 29. Project System Requirements

### FR-PRJ-001 - Project Workspace

The system must let users create a project workspace that stores goals, references, ideas, decisions, and outputs.

### FR-PRJ-002 - Project Memory Boundaries

The system must keep project-scoped context isolated unless the user explicitly wants broader personal context used.

### FR-PRJ-003 - Project Continuity

The system must preserve project state across sessions so the user does not need to restate context.

## 30. UX and Frontend Requirements

The MVP frontend should prioritize clarity, trust, and quick capture.

### Screens

- Home
- Capture
- Timeline
- Discovery
- Model
- Settings
- Privacy

### Home screen

Purpose: provide the current state of the user's intelligence, discoveries, and next best action.

### Capture screen

Purpose: let the user save URLs and PDFs quickly.

### Timeline screen

Purpose: show meaningful captures, model updates, and feedback.

### Discovery screen

Purpose: show explainable recommendations and exploration suggestions.

### Model screen

Purpose: let users inspect and correct what the system believes.

### Settings screen

Purpose: manage sources, permissions, notifications, and account settings.

### Privacy screen

Purpose: explain stored data, export, deletion, and consent.

## 31. Design System Requirements

The UI must feel intelligent, calm, premium, personal, modern, and trustworthy.

### Design tokens

- Semantic colors for surface, text, accent, success, warning, and error
- Consistent spacing scale
- Radius scale for cards, sheets, and controls
- Elevation tokens for surfaces
- Motion tokens for transitions and feedback

### Interaction principles

- Fast and subtle feedback
- Clear loading and empty states
- Accessible focus states
- Reduced motion support
- No decorative animation that does not support comprehension

## 32. Backend Architecture Requirements

The backend must be modular and event-driven.

### Recommended Tech Stack

This stack is optimized for a production-grade MVP with low-friction capture, explainable discovery, and an event-driven model pipeline.

#### Frontend

- React + TypeScript
- Vite for local dev and production builds
- TanStack Query for server-state management
- Zustand or a small domain store for local UI state
- Tailwind CSS or a token-driven CSS system for styling
- Framer Motion only for subtle, purposeful motion

#### Mobile and capture surfaces

- React Native if the first mobile companion is needed early
- Browser extension in TypeScript for one-click URL capture
- Native share-sheet integration later if mobile capture becomes a launch priority

#### Backend

- TypeScript on Node.js for API and orchestration services
- NestJS or Fastify for modular service boundaries
- Worker processes in the same TypeScript stack for capture, enrichment, and scheduling jobs

#### Storage and data

- PostgreSQL as the system of record
- pgvector for semantic similarity when vector search is needed
- Redis for caching, rate limiting, and queue coordination
- Object storage such as S3-compatible storage for PDFs, images, audio, and derived artifacts
- Full-text search via PostgreSQL or OpenSearch depending on scale

#### Eventing and async jobs

- Queue system such as BullMQ or a managed queue backed by Redis for MVP
- Kafka or a managed event bus only if throughput grows beyond MVP needs

#### AI and inference

- OCR/document parsing: Azure Document Intelligence, Google Document AI, or an open-source fallback such as Tesseract plus PDF parsers
- Speech-to-text: OpenAI Whisper or a managed transcription API
- Image understanding: multimodal LLM or vision API
- Embeddings: OpenAI, Cohere, or a hosted open-source embedding model
- Ranking and reasoning: LLM plus deterministic ranking rules

#### Observability and operations

- OpenTelemetry for traces and metrics
- Structured logging with a tool like Pino or equivalent
- Error tracking with Sentry or similar
- Container deployment with Docker; orchestration with Kubernetes or a managed container platform later

### Service boundaries

- API service
- Capture service
- Inference service
- Personal model service
- Discovery service
- Project service
- Notification service
- Worker service

### Data flow

```text
API -> Application Services -> Domain Logic -> Repositories -> Database
Event -> Queue -> Worker -> AI Processing -> Model Update
```

### Principles

- Long-running AI tasks must not block API requests.
- All event processing must be resumable.
- Model updates must be auditable.
- Services must remain replaceable and loosely coupled.

## 33. API Requirements

### Core endpoints

- POST /captures
- GET /captures
- GET /timeline
- GET /discovery
- POST /feedback
- GET /model
- PATCH /model/inferences
- POST /projects
- GET /projects/:id

### API behavior

- All endpoints must be authenticated.
- Capture endpoints must be idempotent.
- Errors must be structured and actionable.
- Read endpoints must support pagination.
- Sensitive model data must be access-controlled.

## 34. Database Requirements

The system must store the following entities at minimum:

- User
- Event
- Source
- Artifact
- ArtifactVersion
- Concept
- Entity
- Relationship
- Preference
- PreferenceSignal
- KnowledgeState
- TasteState
- CreativeState
- Interest
- Curiosity
- Project
- ProjectReference
- Creation
- Recommendation
- RecommendationReason
- Feedback
- ModelSnapshot
- AIInference

### Database rules

- All major records need created_at and updated_at.
- Soft deletion must be supported where derived state exists.
- Audit history is required for user-visible corrections and deletions.
- Access control must be enforced at the row or service layer.

## 35. Search and Vector Requirements

Use the right retrieval mechanism for the right job.

- Structured relational data for identity and state
- Full-text search for raw content and documents
- Embeddings for semantic similarity and candidate retrieval
- Graph relationships for concept and preference structure

Do not store everything only in a vector database.

## 36. Queue and Worker Requirements

### Job types

- content_extraction
- semantic_analysis
- model_update
- recommendation_refresh
- notification_send
- deletion_propagation
- embedding_refresh

### Worker behavior

- Jobs must be retryable.
- Failed jobs must move to a dead-letter queue.
- Jobs must be idempotent.
- Jobs must expose status for debugging.

## 37. Security Requirements

- Authentication is required for all personal data.
- Source permissions must be explicit.
- Sensitive data must be encrypted in transit and at rest.
- The system must maintain audit logs for important actions.
- Third-party providers must not receive unnecessary data.
- User data must not be used for model training unless explicitly allowed.

## 38. Privacy Requirements

- The user must know what is stored and why.
- The user must be able to export and delete data.
- The system must distinguish explicit user-provided data from inferred data.
- Deleting content must propagate to search, embeddings, caches, recommendations, and downstream model state.

## 39. Personal Model Transparency Requirements

The user must be able to inspect the model at an understandable level.

### Allowed controls

- Correct
- Remove
- Strengthen
- Weaken
- Mark temporary
- Mark project-specific

The UI should expose concise, user-safe explanations, not internal chain-of-thought.

## 40. Notification Requirements

Notifications must be useful, not noisy.

### Notification examples

- A newly discovered item that matches a refined preference
- A connection between current learning and an older saved artifact
- A recommendation that explores a nearby adjacent taste

### Notification rules

- No engagement-bait reminders
- No empty reactivation nudges
- User controls frequency and channels

## 41. Analytics Requirements

Measure value, not vanity.

### Activation

- First capture
- First useful model update
- First accepted recommendation

### Engagement

- Meaningful captures
- Discovery interactions
- Creative sessions
- Project activity

### Quality

- Recommendation acceptance rate
- Recommendation correction rate
- Discovery diversity
- Model confidence growth

### Retention

- 7-day retention
- 30-day retention
- 90-day retention

## 42. Testing Requirements

### Unit tests

- Event normalization
- Confidence scoring
- Preference decay
- Novelty scoring
- Recommendation ranking
- Graph operations

### Integration tests

- Capture to ingestion
- Inference pipeline
- Model update
- Search and retrieval
- Authentication and authorization
- Deletion propagation

### End-to-end tests

- Capture -> interpret -> update -> recommend
- Recommendation -> feedback -> update -> future recommendation
- Project context -> creation -> save -> feedback

## 43. Failure Handling Requirements

- Failed capture processing must be retryable.
- Partial extraction failures must not lose the original artifact.
- Recommendation failures must degrade to a safe fallback feed.
- Deletion must continue until downstream systems are reconciled.
- All failures must be logged and observable.

## 44. Edge Cases

- Duplicate captures
- Duplicate events from multiple sources
- Out-of-order events
- Shared devices
- Temporary interests mistaken for long-term taste
- Research mistaken for preference
- Deleted content still appearing in search
- Offline capture sync conflicts
- Extraction failures on scanned PDFs
- Contradictory likes and dislikes

## 45. Metrics of Completion

The MVP is complete when:

- A user can capture URLs and PDFs in one step.
- The system extracts meaningful concepts and preference signals.
- The personal model updates over time.
- The system explains recommendations clearly.
- The user can correct mistaken inferences.
- The discovery feed produces useful results consistently.

## 46. Recommended Build Order

1. Capture and ingestion pipeline
2. Document and URL extraction
3. Personal model storage
4. Explainable discovery feed
5. Feedback and correction UX
6. Deletion and privacy controls
7. Project workspace
8. Taste exploration
9. Multimodal expansion

## 47. Risks

### Risk 1 - Scope creep

Mitigation: keep launch focused on browser and PDF capture plus discovery.

### Risk 2 - Weak personalization early on

Mitigation: narrow the wedge, show explanations, and use explicit feedback.

### Risk 3 - Privacy concerns

Mitigation: explicit permissions, deletion, export, and transparent model views.

### Risk 4 - Noisy recommendations

Mitigation: balance novelty with relevance and track quality metrics.

## 48. Dependencies

- Authentication and user accounts
- Object storage for files
- Search infrastructure
- Queue and background workers
- OCR and document parsing
- Embedding and ranking services
- Basic analytics and observability

## 49. Definition of Done

The product is done for MVP when:

- Capture is reliable and low-friction.
- Inference produces useful, explainable signals.
- Discovery feels personalized and trustworthy.
- The user can inspect and correct the model.
- The system handles failure and deletion correctly.
- The engineering team can extend the platform without redesigning the model layer.

## 50. Open Questions

- Should the first production client be web-first or mobile-first?
- Should browser extension support be in MVP or V1?
- Which source should be the first flagship integration after URL and PDF capture?
- How much of the model should be visible to users by default?
- Which specific domain should be used for early testing of discovery quality?
