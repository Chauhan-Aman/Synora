# Synora

> A privacy-first personal knowledge graph and agentic retrieval-augmented generation (RAG) platform powered by local machine learning models.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_Inference-000000?logo=ollama&logoColor=white)](https://ollama.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

Synora is an open-source, local-first knowledge management system that bridges the gap between passive note-taking and active retrieval. It ingests multi-modal data—including web pages, academic PDFs, YouTube video transcripts, and diagrammatic images—and autonomously structures them into an interactive Knowledge Graph.

By executing all embedding generation, entity extraction, and conversational reasoning on-device through **Ollama**, Synora guarantees absolute data sovereignty with zero third-party cloud data transmission. Users query and explore their knowledge base via an agentic conversational assistant backed by hybrid vector search and an interactive 2D force-directed physics graph.

---

## Demonstration

<video src="https://github.com/Chauhan-Aman/Synora/raw/master/synora-demo.mp4" controls="controls" muted="muted" width="100%"></video>

---

## System Architecture

```
[ Web Client / Chrome Extension (V3) ]
                    │
                    ▼  (REST / SSE)
       [ NestJS Application Core ]
          │                   │
  (Transactional)     (Async Inference Jobs)
          │                   │
          ▼                   ▼
    [ PostgreSQL ]     [ Redis / BullMQ ]
    - Relational Data         │
    - pgvector (768-d)        ▼
          ▲            [ Inference Worker ]
          │            - Cheerio / PDF-Parse / Transcripts
          │            - LLaMA 3.2 Vision (OCR / Diagrams)
          └─────────── - nomic-embed-text (Embeddings)
                       - LLaMA 3.1 & Qwen 2.5 (Graph / RAG)
```

---

## Core Capabilities

### Multi-Modal Ingestion Pipeline
- **Web Content & Articles:** Sanitizes raw HTML using Cheerio, stripping non-content markup and preserving semantic hierarchy.
- **YouTube Video Intelligence:** Interfaces with transcription endpoints to extract timed audio scripts from video URLs.
- **PDF Document Parsing:** Extracts linear text streams and structural metadata from multi-page PDFs using structured buffer parsers.
- **Computer Vision OCR:** Dispatches raster images, diagrams, and infographics to `llama3.2-vision` to produce structured textual representations of visual data.

### Asynchronous Queue Processing
- Offloads compute-intensive extraction and embedding workloads to a Redis-backed **BullMQ** job pipeline, preventing event loop blocking.
- Implements concurrency throttles to prevent GPU resource contention during parallel file processing.
- Features failure recovery and exponential backoff retry mechanisms.

### Agentic RAG & Hybrid Retrieval
- **Hybrid Search Engine:** Combines dense semantic vector retrieval via PostgreSQL `pgvector` (768-dimensional embeddings via `nomic-embed-text`) with keyword-based relational matching, fused through **Reciprocal Rank Fusion (RRF)**.
- **Autonomous Tool-Calling Agent:** Powered by `qwen2.5:14b`, the conversational agent analyzes user intent, determines when local context is insufficient, and executes external web retrieval (DuckDuckGo fallback) autonomously.
- **Real-Time Streaming:** Transmits model outputs to the client interface using Server-Sent Events (SSE) for minimal time-to-first-token.

### Relational Knowledge Graph
- Automatically links ingested artifacts to extracted entities and domain topics.
- Visualizes conceptual topologies using an interactive physics simulation (`d3-force` / `react-force-graph-2d`).
- Dynamically scales node mass and spring tension based on relational reference frequencies.

### Automated Spaced Repetition (SuperMemo-2)
- Executes scheduled background cron services to analyze recent conceptual nodes and synthesize targeted active-recall flashcard decks.
- Implements the **SuperMemo-2 (SM-2)** algorithm to calculate optimal review intervals and decay factors based on user feedback ratings.

### Companion Chrome Extension (Manifest V3)
- Lightweight client integrating directly with Chrome's service worker architecture.
- Offers context-menu hooks for single-click article and selected text capture, communicating with the local API via authenticated token storage.

---

## Technical Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Single-page application framework |
| | Tailwind CSS, Lucide React | Interface styling and component primitives |
| | React Force Graph (D3) | Physics-driven Knowledge Graph rendering |
| | Server-Sent Events (SSE) | Real-time token streaming client |
| **Backend** | NestJS (Node.js) | Modular application server and dependency injection |
| | Prisma ORM | Object-relational mapping and schema management |
| | BullMQ & Redis | Distributed job queue and async task coordination |
| | Cheerio, pdf-parse | Data scraping, extraction, and sanitization |
| **Data & AI** | PostgreSQL + pgvector | Relational data persistence and vector similarity indexing |
| | Ollama | On-device model runtime and orchestration |
| | LLaMA 3.1 & Qwen 2.5 (14B) | Entity/topic extraction and agentic query reasoning |
| | LLaMA 3.2 Vision | Multi-modal OCR and diagram interpretation |
| | nomic-embed-text | 768-dimensional dense vector embeddings |
| **Extension** | Chrome Manifest V3 | Background service workers, context-menu integrations |

---

## Getting Started

### Prerequisites

Ensure the following runtimes and services are available on your system:
- **Node.js**: `v18.0.0` or higher
- **PostgreSQL**: `v15+` with the `pgvector` extension installed
- **Redis**: `v6+` (running locally or via container)
- **Ollama**: Running locally at `http://localhost:11434`

### 1. Model Initialization

Pull the required inference and embedding models via Ollama:

```bash
ollama pull qwen2.5:14b
ollama pull llama3.1
ollama pull llama3.2-vision
ollama pull nomic-embed-text
```

### 2. Repository Setup

Clone the repository and install workspace dependencies:

```bash
git clone https://github.com/Chauhan-Aman/Synora.git
cd Synora

# Install monorepo dependencies
npm install
cd apps/api && npm install
cd ../web && npm install
```

### 3. Environment Configuration

Create environment definitions for both the API and Web applications:

**`apps/api/.env`**
```env
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/synora?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
OLLAMA_BASE_URL="http://localhost:11434"
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="your-secure-jwt-secret"
```

**`apps/web/.env`**
```env
VITE_API_URL="http://localhost:3001"
```

### 4. Database Provisioning

Apply schema migrations and push the data model to PostgreSQL:

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### 5. Running the Application

Start the backend API server:
```bash
cd apps/api
npm run start:dev
```

In a separate terminal, launch the web client:
```bash
cd apps/web
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Security & Privacy Guarantee

Synora was engineered around strict data sovereignty principles:
- **Zero Cloud Ingestion:** Embedding generation, context evaluation, and summarization run strictly within the local host environment.
- **Isolated Storage:** Relational records and high-dimensional vectors reside in a self-hosted PostgreSQL instance with strict tenant isolation.
- **Deterministic Outbound Requests:** Network calls are strictly limited to explicit user actions, such as fetching user-provided URLs or fallback web search queries via DuckDuckGo.

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).
