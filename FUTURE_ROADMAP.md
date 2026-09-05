# Synora Engine — Future Roadmap

> **Last Updated:** August 2026  
> **Hardware:** RTX 5070 (12GB VRAM) • Local-first, privacy-focused  
> **Philosophy:** Everything runs on your machine. Zero API costs. Zero data leaves your PC.

---

## ✅ Completed Phases

### Phase 1 — Core RAG Engine (MVP)
- [x] URL & Text capture with background processing (BullMQ + Redis)
- [x] Ollama-powered LLM inference (Llama 3.2)
- [x] Vector embeddings with pgvector (nomic-embed-text)
- [x] Topic & Entity extraction
- [x] Knowledge Graph visualization (Force-Directed 2D Graph)

### Phase 2 — Multi-Tenant Authentication
- [x] JWT authentication with bcrypt password hashing
- [x] Per-user data isolation across all tables
- [x] Glassmorphic Login/Register UI

### Phase 3 — Advanced RAG & Hybrid Search
- [x] 500-word chunk splitting for large documents
- [x] BM25 keyword search + Vector similarity (Hybrid Search with RRF)
- [x] tsvector full-text search integration

### Phase 4 — Chrome Extension (Web Clipper)
- [x] Manifest V3 Chrome extension (`apps/extension/`)
- [x] Popup UI with login/logout and one-click URL capture
- [x] JWT auth via `chrome.storage.local`
- [x] Sends current tab URL directly to Synora backend for processing

### Phase 5 — Automated Learning
- [x] SM-2 spaced repetition flashcard engine
- [x] Cron-based automatic flashcard generation from topics
- [x] Interactive Learn tab with flip cards and difficulty ratings

### Phase 6 — Discovery Engine
- [x] AI taste profile generation from user's knowledge graph
- [x] Autonomous recommendation generation (Concepts & Synthesis)
- [x] "Explore" (auto-ingest) and "Dive Deeper" (nested recommendations)

### Phase 7 — Voice & Agentic RAG
- [x] Speech-to-Text input (Web Speech API)
- [x] Text-to-Speech responses (SpeechSynthesis API)
- [x] Agentic web browsing — Synora autonomously searches the internet when local knowledge is insufficient
- [x] Multi-tool agent loop with automatic knowledge ingestion from web results

### Phase 8 — Create Studio
- [x] Rich Text Editor (Tiptap) for long-form writing
- [x] Context-aware AI paragraph generation from Knowledge Graph
- [x] Approve & Merge workflow with inline revision prompts
- [x] Dynamic model selection from Settings

### Phase 9 — Multimodal Expansion
- [x] Image capture & analysis (Llama 3.2 Vision)
- [x] PDF text extraction and ingestion (pdf-parse)
- [x] Audio/Voice note capture and transcription
- [x] File upload UI with drag-and-drop support

### Phase 10 — UI/UX Polish
- [x] Settings modal overlay (non-disruptive)
- [x] Progress bars and loading states across all tabs
- [x] Error boundary for graceful crash recovery
- [x] Responsive layout fixes

---

## 🚧 In Progress / Next Up

### Phase 11 — Desktop Application (Tauri)
**Goal:** Make Synora a native Windows app that lives in your system tray.
**Cost:** Free (open-source Rust framework)

- [ ] Wrap React web app in Tauri shell
- [ ] System tray icon with quick-capture menu
- [ ] Global hotkey (`Ctrl + Shift + S`) — opens a Spotlight-like search bar over any app
- [ ] Auto-start on Windows boot (optional)
- [ ] Native file system access for drag-and-drop capture
- [ ] Auto-update mechanism

**Tech:** Tauri v2, Rust backend, WebView2

---

## 📋 Planned Features

### Phase 12 — Visual Knowledge Generation (Diagrams & Procedural Covers)
**Goal:** Generate dynamic structural diagrams and semantic cover art directly from your knowledge without overloading the GPU.
**Cost:** Free — runs locally using existing Llama 3.2 model (No VRAM penalty).

- [ ] Knowledge-to-Diagram — auto-generate visual diagrams (Mind Maps, Flowcharts) using Mermaid JS from topics/entities
- [ ] Procedural Semantic Cover Art — algorithmically generate beautiful CSS/SVG covers based on text sentiment/keywords
- [ ] Diagram Viewer in Knowledge Tab — interactive zooming and panning for generated Mermaid graphs
- [ ] "Illustrate" button in Create Studio — generates a procedural cover for your article

**Tech:** Llama 3.2 (Prompting), Mermaid JS, CSS Mesh Gradients

---

### Phase 13 — Content Pipeline (Blog + Social Media)
**Goal:** Turn your knowledge into publishable content with one click.
**Cost:** Free

- [ ] "Generate Blog Post" — select topics from your Knowledge Graph → AI writes a full article
- [ ] "Generate LinkedIn Post" — concise, professional summary with auto-generated cover image
- [ ] "Generate Twitter/X Thread" — breaks down a topic into a tweet thread
- [ ] Export to Markdown, HTML, or PDF
- [ ] Template system (Blog, Newsletter, Social Post, Academic Paper)
- [ ] Content calendar view

---

### Phase 14 — Chrome Extension Enhancements
**Goal:** Extend the existing Chrome extension with power-user features.
**Cost:** Free

- [x] Right-click context menu: "Send to Synora"
- [x] Highlight text on any webpage → one-click capture selected text
- [ ] Auto-capture mode: silently saves every article you read (optional)
- [x] Popup mini-chat: ask Synora questions about the current page
- [x] Extension icon badge showing capture count

---

### Phase 15 — Advanced Knowledge Features
**Goal:** Make the Knowledge Graph smarter and more interactive.
**Cost:** Free

- [x] Knowledge conflicts detection (contradicting information across sources)
- [x] Temporal knowledge tracking (how your understanding of a topic evolved over time)
- [x] Knowledge gaps analysis ("You know a lot about X but nothing about related topic Y")
- [ ] Collaborative knowledge sharing (export/import knowledge packs between users)
- [ ] Annotation system — highlight and annotate specific chunks
- [ ] Smart folders / collections for organizing artifacts

---

### Phase 16 — Better AI Models
**Goal:** Leverage the RTX 5070 for more powerful local inference.
**Cost:** Free

- [x] Llama 3.1 8B Instruct (better reasoning, fits in 12GB)
- [x] Automatic model selection based on task type
- [ ] Gemma 2 9B (Google's efficient model)
- [ ] DeepSeek Coder v2 (for code-related knowledge)
- [ ] Qwen 2.5 (multilingual support)
- [ ] Model A/B testing — compare outputs from different models side-by-side

---

## 💡 Future Ideas (Exploration Phase)

These are ambitious ideas that may require external APIs or significant R&D:

### Video & Reels Generation
- [ ] Script generation from knowledge graph topics
- [ ] Local TTS with expressive voices (Coqui TTS / Piper)
- [ ] Slideshow-style video generation from images + voiceover
- [ ] Integration with Runway / Luma API (paid, ~$15-50/month) for advanced video

### Mobile App
- [ ] React Native or Flutter companion app
- [ ] Push notifications for flashcard reminders
- [ ] Voice capture on the go
- [ ] Offline mode with sync

### Collaboration & Teams
- [ ] Shared knowledge graphs between team members
- [ ] Role-based access control (Viewer, Editor, Admin)
- [ ] Real-time collaborative editing in Create Studio
- [ ] Team discovery feed

### API & Integrations
- [ ] REST API for third-party integrations
- [ ] Notion import/export
- [ ] Obsidian vault sync
- [ ] Readwise integration
- [ ] Zapier/n8n webhooks

---

## 🏗️ Architecture Notes

```
┌─────────────────────────────────────────────────┐
│                  Tauri Shell                      │
│  ┌─────────────────────────────────────────────┐ │
│  │            React Frontend (Vite)             │ │
│  │  Capture │ Knowledge │ Chat │ Create │ Learn │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │ HTTP                        │
│  ┌──────────────────▼──────────────────────────┐ │
│  │          NestJS Backend API                  │ │
│  │  Auth │ Capture │ Knowledge │ Chat │ Create  │ │
│  └───┬──────────┬──────────┬───────────────────┘ │
│      │          │          │                      │
│  ┌───▼───┐  ┌───▼───┐  ┌──▼──────────────────┐  │
│  │Postgres│  │ Redis │  │  Ollama (Local AI)   │  │
│  │pgvector│  │BullMQ │  │  Llama 3.2          │  │
│  │       │  │       │  │  nomic-embed-text    │  │
│  │       │  │       │  │  Stable Diffusion*   │  │
│  └───────┘  └───────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────┘
                    * = Planned
```

---

> [!NOTE]
> All phases marked as "Free" run entirely on local hardware (RTX 5070 12GB).  
> No cloud APIs, no subscriptions, no data ever leaves your machine.
