# Synora 🧠✨

> **Your Local, AI-Powered Personal Knowledge Graph**

Synora is a powerful, privacy-first personal knowledge management application. It allows you to seamlessly capture articles, notes, and web content, and automatically structures them into a highly interactive, visualized Knowledge Graph using local AI. 

Chat directly with your notes using a streaming, agentic AI assistant that performs retrieval-augmented generation (RAG) and autonomous web searches to help you learn, discover, and connect ideas.

---

## 🌟 Key Features

- **🌐 Autonomous Knowledge Capture:** Paste a URL and let the backend automatically scrape, clean, and extract entities, topics, and relationships to build your graph.
- **🧠 100% Local AI:** Powered by **Ollama**, Synora uses local LLMs (dynamically routing between `qwen2.5:14b`, `qwen2.5-coder:14b`, and `llama3.1`) and `nomic-embed-text` for embeddings to ensure your personal data never leaves your machine.
- **🕸️ Interactive 2D Graph:** Visualize your brain! Explore topics, articles, and entities in a beautiful, physics-based force-directed graph.
- **💬 Streaming Agentic Chat:** A professional-grade, SSE-streamed chat interface. The AI agent evaluates your local context, rewrites queries, and performs autonomous web searches if your local knowledge falls short.
- **🧑‍💻 Developer Ready:** Features beautifully syntax-highlighted code blocks in the chat with click-to-copy functionality.
- **📰 Content Generation & Insights:** Auto-generate newsletters, academic papers, and dynamic visual diagrams (MermaidJS) from your knowledge graph.

---

## 🏗️ Architecture & Tech Stack

Synora is a modern monorepo built with performance, aesthetics, and modularity in mind.

### **Frontend (`apps/web`)**
- **React 18** (Vite)
- **Zustand / Custom Hooks** for state management (Modularized architecture)
- **Tailwind CSS** for sleek, responsive styling
- **Lucide React** for beautiful iconography
- **TipTap** for headless Rich Text Editing in the Create Studio
- **React Force Graph** for rich data visualization
- **Server-Sent Events (SSE)** for real-time AI response streaming

### **Backend (`apps/api`)**
- **NestJS** (Node.js framework)
- **Prisma** ORM + **PostgreSQL** database
- **Ollama API Integration** for LLM inference and embeddings
- **Cheerio** for background web scraping and content extraction
- **Reciprocal Rank Fusion (RRF)** for advanced hybrid search (BM25 + Vector)

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+)
2. **PostgreSQL** running locally or via Docker
3. **Ollama** installed and running (`http://localhost:11434`)
   - Pull required models: 
     ```bash
     ollama run qwen2.5:14b
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

3. **Database Setup:**
   Navigate to the API directory and configure your `.env` file with your PostgreSQL connection string:
   ```bash
   cd apps/api
   # Create a .env file: DATABASE_URL="postgresql://user:password@localhost:5432/synora?schema=public"
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
Synora is designed to be a private "second brain." Because all AI inference (embeddings, query rewriting, context evaluation, and generation) happens locally via Ollama, your personal notes and queries are never sent to third-party cloud APIs (unless explicitly fetching a public URL).

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
