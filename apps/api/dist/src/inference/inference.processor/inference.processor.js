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
var InferenceProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InferenceProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cheerio = __importStar(require("cheerio"));
let InferenceProcessor = InferenceProcessor_1 = class InferenceProcessor extends bullmq_1.WorkerHost {
    prisma;
    logger = new common_1.Logger(InferenceProcessor_1.name);
    OLLAMA_URL = 'http://localhost:11434/api/generate';
    OLLAMA_MODEL = 'llama3.2';
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async process(job) {
        const { artifactId } = job.data;
        this.logger.log(`Processing job ${job.id} for artifact ${artifactId}`);
        const artifact = await this.prisma.artifact.findUnique({
            where: { id: artifactId },
        });
        if (!artifact) {
            throw new Error('Artifact not found');
        }
        await this.prisma.artifact.update({
            where: { id: artifactId },
            data: { status: 'processing' },
        });
        try {
            let contentToProcess = artifact.content || '';
            if (artifact.type === 'URL' && artifact.sourceUrl) {
                this.logger.log(`Fetching content from URL: ${artifact.sourceUrl}`);
                const response = await fetch(artifact.sourceUrl);
                const html = await response.text();
                const $ = cheerio.load(html);
                $('script, style, nav, footer, iframe').remove();
                contentToProcess = $('body').text().replace(/\s+/g, ' ').trim();
                await this.prisma.artifact.update({
                    where: { id: artifactId },
                    data: { content: contentToProcess.substring(0, 5000) },
                });
            }
            this.logger.log(`Sending to Ollama (${this.OLLAMA_MODEL}) for extraction...`);
            const prompt = `
        You are a highly capable AI specialized in extracting structured knowledge graphs from text.
        Extract the most important topics, named entities, and provide a short summary of the following text.
        
        TEXT TO ANALYZE:
        "${contentToProcess.substring(0, 4000)}"
        
        Respond ONLY with a valid JSON object matching this exact schema, do not include markdown blocks or any other text:
        {
          "summary": "A 2-3 sentence summary of the text",
          "topics": ["Topic 1", "Topic 2", "Topic 3"],
          "entities": [
            {"name": "Entity Name", "type": "PERSON | ORGANIZATION | TECHNOLOGY | LOCATION | CONCEPT"}
          ]
        }
      `;
            let extractedData;
            try {
                const ollamaResponse = await fetch(this.OLLAMA_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: this.OLLAMA_MODEL,
                        prompt: prompt,
                        stream: false,
                        format: 'json'
                    })
                });
                if (!ollamaResponse.ok) {
                    throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
                }
                const data = await ollamaResponse.json();
                extractedData = JSON.parse(data.response);
            }
            catch (ollamaError) {
                this.logger.error(`Ollama Extraction Failed: ${ollamaError.message}`);
                this.logger.warn('Please ensure Ollama is installed and running on port 11434 with the llama3.2 model.');
                throw new Error('LLM Extraction Failed');
            }
            this.logger.log('Ollama extraction successful! Saving metadata to the database...');
            if (extractedData.summary) {
                await this.prisma.summary.create({
                    data: {
                        text: extractedData.summary,
                        artifactId: artifactId,
                        userId: artifact.userId,
                    },
                });
            }
            if (Array.isArray(extractedData.topics)) {
                for (const topic of extractedData.topics) {
                    await this.prisma.topic.upsert({
                        where: { name_userId: { name: topic, userId: artifact.userId } },
                        update: { artifacts: { connect: { id: artifactId } } },
                        create: { name: topic, userId: artifact.userId, artifacts: { connect: { id: artifactId } } },
                    });
                }
            }
            if (Array.isArray(extractedData.entities)) {
                for (const entity of extractedData.entities) {
                    await this.prisma.entity.upsert({
                        where: { name_type_userId: { name: entity.name, type: entity.type, userId: artifact.userId } },
                        update: { artifacts: { connect: { id: artifactId } } },
                        create: { name: entity.name, type: entity.type, userId: artifact.userId, artifacts: { connect: { id: artifactId } } },
                    });
                }
            }
            this.logger.log('Generating vector embedding...');
            try {
                const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'nomic-embed-text',
                        prompt: contentToProcess.substring(0, 4000)
                    })
                });
                if (embeddingResponse.ok) {
                    const embedData = await embeddingResponse.json();
                    const vector = embedData.embedding;
                    const vectorString = `[${vector.join(',')}]`;
                    await this.prisma.$executeRaw `UPDATE "Artifact" SET embedding = ${vectorString}::vector WHERE id = ${artifactId}`;
                    this.logger.log('Vector embedding saved successfully!');
                }
                else {
                    this.logger.warn(`Failed to generate embedding: ${embeddingResponse.statusText}`);
                }
            }
            catch (err) {
                this.logger.warn(`Failed to connect to Ollama for embeddings: ${err.message}`);
            }
            await this.prisma.artifact.update({
                where: { id: artifactId },
                data: { status: 'completed' },
            });
            this.logger.log(`Successfully completed job ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
            await this.prisma.artifact.update({
                where: { id: artifactId },
                data: { status: 'failed' },
            });
            throw error;
        }
    }
};
exports.InferenceProcessor = InferenceProcessor;
exports.InferenceProcessor = InferenceProcessor = InferenceProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('capture-processing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InferenceProcessor);
//# sourceMappingURL=inference.processor.js.map