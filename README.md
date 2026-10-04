# Synora 🧠✨

> **Your Local, AI-Powered Personal Knowledge Graph**

Synora is a powerful, privacy-first personal knowledge management application. It allows you to seamlessly capture articles, notes, web content, PDFs, images, and YouTube videos, and automatically structures them into a highly interactive, visualized Knowledge Graph using local AI. 

Chat directly with your notes using a streaming, agentic AI assistant that performs retrieval-augmented generation (RAG) and autonomous web searches to help you learn, discover, and connect ideas.

---

## 🎥 See it in Action

<video src="https://github.com/Chauhan-Aman/Synora/raw/master/synora-demo.mp4" controls="controls" muted="muted" width="100%"></video>

*(Make sure your volume is on to hear Synora's Voice Assistant!)*

---

## 🌟 Key Features

- **🌐 Autonomous Knowledge Capture:** Paste a URL (including YouTube videos) and let the backend automatically scrape, clean, and extract entities, topics, and relationships to build your graph.
- **🧩 Chrome Web Clipper:** Synora includes a companion Manifest V3 Chrome Extension that allows you to capture articles and save URLs with a single click directly from your browser.
- **📄 Multi-modal Ingestion:** Upload PDFs and Images for extraction! Uses `llama3.2-vision` to deeply analyze and transcribe diagrams, infographics, and text from images.
- **🧠 100% Local AI:** Powered by **Ollama**, Synora uses local LLMs (dynamically routing between `qwen2.5:14b` for reasoning and `llama3.1` for extraction) and `nomic-embed-text` for vector embeddings to ensure your personal data never leaves your machine.
- **🕸️ Interactive 2D Graph:** Visualize your brain! Explore topics, articles, and entities in a beautiful, physics-based force-directed graph.
- **💬 Streaming Agentic Chat:** A professional-grade, SSE-streamed chat interface with full **Session History**. The AI agent evaluates your local context, rewrites queries, and performs autonomous web searches if your local knowledge falls short.
- **🎙️ Voice Integration:** Capture thoughts via voice dictation, and have Synora read out AI answers using built-in Text-To-Speech (TTS).
- **🎓 Spaced Repetition Learning:** Automatically generates interactive flashcards based on your saved knowledge and schedules them for daily learning sessions.
- **📰 Content Generation & Insights:** Auto-generate newsletters, academic papers, and dynamic visual diagrams (MermaidJS) from your knowledge graph.
- **⚙️ Complete Control:** Easily wipe your knowledge base with the "Danger Zone" to start fresh, and filter through your generated artifacts with Topic Search.

---

## 🏗️ Architecture & Tech Stack

Synora is a modern monorepo built with performance, aesthetics, and modularity in mind.

### **Frontend (`apps/web`)**
- **React 18** (Vite)
- **Zustand / Custom Hooks** for state management
- **Tailwind CSS** for sleek, responsive, glassmorphism styling
- **Lucide React** for beautiful iconography
- **React Force Graph** for rich data visualization
- **Server-Sent Events (SSE)** for real-time AI response streaming

### **Backend (`apps/api`)**
- **NestJS** (Node.js framework)
- **Prisma** ORM + **PostgreSQL** database
- **Ollama API Integration** for LLM inference and embeddings
- **YouTube-Transcript & PDF-Parse** for rich media ingestion
- **BullMQ / Background Jobs** for asynchronous extraction processing
- **Reciprocal Rank Fusion (RRF)** for advanced hybrid search (BM25 + Vector)

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+)
2. **PostgreSQL** running locally or via Docker
3. **Ollama** installed and running (`http://localhost:11434`)
   - Pull required models: 
     ```bash
     ollama pull qwen2.5:14b
     ollama pull llama3.1
     ollama pull llama3.2-vision
     ollama pull nomic-embed-text
     ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chauhan-Aman/Synora.git
   cd Synora
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd apps/api && npm install
   cd ../web && npm install
   ```

3. **Environment Setup:**
   Create `.env` files in both the API and Web directories:
   
   **`apps/api/.env`**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/synora?schema=public"
   OLLAMA_BASE_URL="http://localhost:11434"
   FRONTEND_URL="http://localhost:5173"
   ```

   **`apps/web/.env`**
   ```env
   VITE_API_URL="http://localhost:3001"
   ```

4. **Database Setup:**
   Navigate to the API directory and push the schema:
   ```bash
   cd apps/api
   npx prisma generate
   npx prisma db push
   ```

### Running the App

1. **Start the Backend API:**
   ```bash
   cd apps/api
   npm run start:dev
   ```

2. **Start the Frontend Client:**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Access Synora:**
   Open your browser and navigate to `http://localhost:5173`.

---

## 🛡️ Privacy & Security
Synora is designed to be a completely private "second brain." Because all AI inference (embeddings, query rewriting, context evaluation, image analysis, and generation) happens locally via Ollama, your personal notes and queries are never sent to third-party cloud APIs (unless explicitly fetching a public URL).

---

## 🙏 Acknowledgements & Gratitude

This project is built upon the shoulders of giants. We want to extend our deepest gratitude to:
- **[Ollama](https://ollama.com/)**: For entirely democratizing local LLM inference. Without Ollama, building a truly private, fast, and local AI agent simply would not be possible for everyday hardware.
- **Google Antigravity**: For being an incredible pair-programming agent and making the intense development process of this monorepo smooth, educational, and remarkably productive. 

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
