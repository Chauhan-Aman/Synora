# Synora Engine – Future Roadmap

> **Last Updated:** October 2026  
> **Hardware:** RTX 5070 (12GB VRAM) – Local-first, privacy-focused  
> **Philosophy:** Everything runs on your machine. Zero API costs. Zero data leaves your PC.

---

## ✅ Completed Phases

### Phase 1 – Core RAG Engine (MVP)
- [x] URL & Text capture with background processing (BullMQ + Redis)
- [x] Ollama-powered LLM inference (Llama 3.1 & Qwen 2.5)
- [x] Vector embeddings with pgvector (nomic-embed-text)
- [x] Topic & Entity extraction
- [x] Knowledge Graph visualization (Force-Directed 2D Graph)

### Phase 2 – Multi-Tenant Authentication
- [x] JWT authentication with bcrypt password hashing
- [x] Per-user data isolation across all tables
- [x] Glassmorphic Login/Register UI

### Phase 3 – Advanced RAG & Hybrid Search
- [x] 500-word chunk splitting for large documents
- [x] BM25 keyword search + Vector similarity (Hybrid Search with RRF)
- [x] tsvector full-text search integration

### Phase 4 – Chrome Extension (Web Clipper)
- [x] Manifest V3 Chrome extension (`apps/extension/`)
- [x] Popup UI with login/logout and one-click URL capture
- [x] JWT auth via `chrome.storage.local`
- [x] Sends current tab URL directly to Synora backend for processing

### Phase 5 – Automated Learning
- [x] SM-2 spaced repetition flashcard engine
- [x] Cron-based automatic flashcard generation from topics
- [x] Interactive Learn tab with flip cards and difficulty ratings

### Phase 6 – Discovery Engine
- [x] AI taste profile generation from user's knowledge graph
- [x] Autonomous recommendation generation (Concepts & Synthesis)
- [x] "Explore" (auto-ingest) and "Dive Deeper" (nested recommendations)

### Phase 7 – Voice & Agentic RAG
- [x] Speech-to-Text input (Web Speech API)
- [x] Text-to-Speech responses (SpeechSynthesis API)
- [x] Agentic web browsing – Synora autonomously searches the internet when local knowledge is insufficient
- [x] Multi-tool agent loop with automatic knowledge ingestion from web results

### Phase 8 – Multi-Modal Capture
- [x] PDF text extraction via `pdf-parse`
- [x] Image transcription via `llama3.2-vision`
- [x] YouTube transcript extraction via `youtube-transcript`

### Phase 9 – Settings & Customization
- [x] Settings Tab UI
- [x] Custom LLM Instructions / Prompts
- [x] Danger Zone: Wipe Knowledge Base completely
- [x] Session History Sidebar for Chat (Delete, Rename, Resume)
- [x] Configurable Web Search overrides

---

## 🚀 What's Left to Implement (Future Ideas)

While the core functionality of Synora is **100% complete**, here are some ambitious ideas that could be built in the future to take it even further:

### Phase 10 – Visual Knowledge Generation (Diagrams & Procedural Covers)
**Goal:** Generate dynamic structural diagrams directly from your knowledge without overloading the GPU.
- [ ] **Knowledge-to-Diagram:** Auto-generate mind maps and flowcharts using Mermaid JS from topics/entities.
- [ ] **Diagram Viewer:** Interactive zooming and panning for generated Mermaid graphs.

### Phase 11 – Desktop Native App
**Goal:** Wrap the web app in Tauri to make it feel like a truly native desktop experience.
- [ ] Migrate the Vite frontend into a Tauri shell.
- [ ] Add system tray icon for quick note-taking.
- [ ] Global keyboard shortcut (e.g., `Ctrl+Space`) to instantly open Synora from anywhere.

### Phase 12 – Advanced Extensions & Browsing
- [ ] **Highlight Capture:** Right-click highlighted text on any webpage to instantly capture just that snippet into your graph.
- [ ] **Auto-Capture Mode:** Silently ingest and embed every article you read into your secondary brain automatically.
- [ ] **Popup Mini-Chat:** Chat with Synora directly inside the Chrome Extension popup about the webpage you are currently looking at.

### Phase 13 – Collaboration & Export
- [ ] **Export to Obsidian/Markdown:** One-click export your entire knowledge graph as interconnected markdown files.
- [ ] **Knowledge Packs:** Export/Import specific "topics" (e.g., a "Machine Learning 101" pack) to share with friends.
- [ ] **Notion Sync:** Automatically two-way sync your generated insights with Notion.
