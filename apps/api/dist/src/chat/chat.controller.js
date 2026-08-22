"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const cheerio = __importStar(require("cheerio"));
const capture_service_1 = require("../capture/capture.service");
let ChatController = ChatController_1 = class ChatController {
    prisma;
    captureService;
    logger = new common_1.Logger(ChatController_1.name);
    constructor(prisma, captureService) {
        this.prisma = prisma;
        this.captureService = captureService;
    }
    async chat(query, history, user, forceWebSearch, modelParam) {
        const targetModel = modelParam || 'llama3.2';
        if (!query) {
            throw new common_1.HttpException('Query is required', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            let searchQuery = query;
            const agentLogs = [];
            if (history && history.length > 0) {
                const historyText = history.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                const rewritePrompt = `Given the following conversation history, rewrite the user's latest query to be a standalone search query. Replace pronouns (he, she, it, they) with the actual entities they refer to from the history. DO NOT answer the question, ONLY return the rewritten query text.
        
History:
${historyText}

Latest Query: ${query}

Rewritten Query:`;
                try {
                    const rewriteRes = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: targetModel, prompt: rewritePrompt, stream: false }),
                    });
                    if (rewriteRes.ok) {
                        const d = await rewriteRes.json();
                        searchQuery = d.response.trim();
                        this.logger.log(`Rewrote query for search: "${searchQuery}"`);
                        agentLogs.push({ action: 'Query Rewrite', status: 'done', message: `Rewrote query to: "${searchQuery}"` });
                    }
                }
                catch (e) {
                    this.logger.error("Failed to rewrite query", e);
                    agentLogs.push({ action: 'Query Rewrite', status: 'error', message: 'Failed to rewrite query.' });
                }
            }
            this.logger.log(`Embedding user query: "${searchQuery}"`);
            const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: searchQuery,
                }),
            });
            if (!embeddingResponse.ok) {
                throw new Error('Failed to get embeddings from Ollama');
            }
            const embedData = await embeddingResponse.json();
            const vector = embedData.embedding;
            const vectorString = `[${vector.join(',')}]`;
            this.logger.log(`Performing Hybrid Search (BM25 + Vector) for relevant chunks for user ${user.userId}...`);
            const relevantChunks = await this.prisma.$queryRaw `
        WITH vector_results AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${vectorString}::vector) as vector_rank
          FROM "Chunk"
          WHERE "userId" = ${user.userId} AND embedding IS NOT NULL
          ORDER BY vector_rank
          LIMIT 20
        ),
        keyword_results AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd("searchVector", plainto_tsquery('english', ${searchQuery})) DESC) as keyword_rank
          FROM "Chunk"
          WHERE "userId" = ${user.userId} AND "searchVector" @@ plainto_tsquery('english', ${searchQuery})
          ORDER BY keyword_rank
          LIMIT 20
        )
        SELECT 
          c.id, 
          c.text as content,
          a."sourceUrl" as "sourceUrl",
          COALESCE(1.0 / (60 + vr.vector_rank), 0.0) + COALESCE(1.0 / (60 + kr.keyword_rank), 0.0) as rrf_score
        FROM "Chunk" c
        JOIN "Artifact" a ON c."artifactId" = a.id
        LEFT JOIN vector_results vr ON c.id = vr.id
        LEFT JOIN keyword_results kr ON c.id = kr.id
        WHERE vr.id IS NOT NULL OR kr.id IS NOT NULL
        ORDER BY rrf_score DESC
        LIMIT 5;
      `;
            let contextText = "";
            let sources = [];
            if (relevantChunks.length > 0) {
                contextText = relevantChunks
                    .map((c, i) => `[Local Source ${i + 1}] (${c.sourceUrl || 'Text Snippet'}):\n${c.content}`)
                    .join('\n\n');
                const allSources = relevantChunks.map(c => c.sourceUrl || 'Local Text Snippet');
                sources = [...new Set(allSources)];
            }
            this.logger.log("Agent evaluating if local context is sufficient...");
            agentLogs.push({ action: 'Context Evaluation', status: 'done', message: 'Evaluating if local context is sufficient to answer the question...' });
            const evalPrompt = `Does the following context contain sufficient information to answer the user's question?
Context:
${contextText || "No context provided."}

Question: ${searchQuery}

Reply with ONLY the word "YES" or "NO".`;
            let needsWebSearch = forceWebSearch || false;
            if (!forceWebSearch && contextText) {
                try {
                    const evalRes = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: targetModel, prompt: evalPrompt, stream: false }),
                    });
                    const d = await evalRes.json();
                    const responseWord = d.response.trim().toUpperCase();
                    needsWebSearch = responseWord.includes('NO');
                    this.logger.log(`Agent evaluation result: ${responseWord} -> Needs Web Search: ${needsWebSearch}`);
                    agentLogs.push({ action: 'Context Evaluation', status: 'done', message: `LLM decided local context is ${needsWebSearch ? 'insufficient' : 'sufficient'}.` });
                }
                catch (e) {
                    this.logger.error("Failed to evaluate context", e);
                }
            }
            else if (!contextText) {
                needsWebSearch = true;
                agentLogs.push({ action: 'Context Evaluation', status: 'done', message: 'No local context found. Forcing web search.' });
            }
            else if (forceWebSearch) {
                agentLogs.push({ action: 'Context Evaluation', status: 'done', message: 'User explicitly forced a web search.' });
            }
            if (needsWebSearch) {
                this.logger.log(`Executing Autonomous Web Search for: "${searchQuery}"`);
                agentLogs.push({ action: 'Web Search', status: 'done', message: `Searching the Web for "${searchQuery}"` });
                try {
                    const bingRes = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    const bingHtml = await bingRes.text();
                    const $bing = cheerio.load(bingHtml);
                    const searchResults = [];
                    $bing('li.b_algo h2 a').each((i, el) => {
                        const href = $bing(el).attr('href');
                        if (href && href.includes('u=a1')) {
                            const b64 = href.split('u=a1')[1].split('&')[0];
                            try {
                                const realUrl = Buffer.from(b64, 'base64').toString('utf8');
                                searchResults.push({ url: realUrl, title: $bing(el).text() });
                            }
                            catch (e) { }
                        }
                        else if (href && href.startsWith('http')) {
                            searchResults.push({ url: href, title: $bing(el).text() });
                        }
                    });
                    const topResults = searchResults.slice(0, 3);
                    for (let i = 0; i < topResults.length; i++) {
                        const result = topResults[i];
                        this.logger.log(`Scraping web result: ${result.url}`);
                        try {
                            const pageRes = await fetch(result.url, {
                                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
                            });
                            const html = await pageRes.text();
                            const $ = cheerio.load(html);
                            $('script, style, nav, footer, header, iframe, noscript').remove();
                            const text = $('body').text().replace(/\s+/g, ' ').trim();
                            const snippet = text.substring(0, 2000);
                            contextText += `\n\n[Web Search Result ${i + 1}] (${result.url}):\n${snippet}`;
                            sources.push(result.url);
                            agentLogs.push({ action: 'Web Scrape', status: 'done', message: `Scraped and extracted context from: ${result.url}` });
                            this.logger.log(`Pushing ${result.url} to Capture Queue for permanent indexing...`);
                            this.captureService.create({ type: 'WEB_SEARCH', sourceUrl: result.url }, user.userId).catch((e) => {
                                this.logger.error(`Failed to push web result to capture queue: ${e.message}`);
                            });
                        }
                        catch (scrapeErr) {
                            this.logger.error(`Failed to scrape ${result.url}`);
                            agentLogs.push({ action: 'Web Scrape', status: 'error', message: `Failed to scrape ${result.url}` });
                        }
                    }
                }
                catch (searchErr) {
                    this.logger.error("Web search failed", searchErr);
                    agentLogs.push({ action: 'Web Search', status: 'error', message: 'Web search failed.' });
                }
            }
            let historyContext = "";
            if (history && history.length > 0) {
                historyContext = "CONVERSATION HISTORY:\n" + history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + "\n\n";
            }
            const prompt = `
You are Synora, an intelligent and friendly personal assistant. 
You have access to the user's personal knowledge graph, and you can also autonomously search the web if needed.

If the user is just saying hello or asking a general conversational question, answer in a friendly, conversational manner.
If the user is asking a question that requires specific knowledge, try to answer it using the provided context below. 
If the context does not contain the answer, you may use your own general knowledge to answer, but please mention that you are doing so.

${historyContext}
CONTEXT:
${contextText || "No context available."}

QUESTION:
${query}
`;
            this.logger.log(`Generating final answer using Llama 3.2...`);
            const generateResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: targetModel,
                    prompt: prompt,
                    stream: false,
                }),
            });
            if (!generateResponse.ok) {
                throw new Error('Failed to generate answer from Ollama');
            }
            const generationData = await generateResponse.json();
            agentLogs.push({ action: 'Response Generation', status: 'done', message: `Generated final answer using ${targetModel}` });
            return {
                response: generationData.response,
                sources: sources,
                agentLogs: agentLogs
            };
        }
        catch (error) {
            this.logger.error(`Chat error: ${error.message}`);
            throw new common_1.HttpException('Failed to communicate with local AI', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('query')),
    __param(1, (0, common_1.Body)('history')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)('forceWebSearch')),
    __param(4, (0, common_1.Body)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object, Boolean, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "chat", null);
exports.ChatController = ChatController = ChatController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        capture_service_1.CaptureService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map