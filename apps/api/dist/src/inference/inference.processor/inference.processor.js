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
            this.logger.error(`Artifact ${artifactId} not found!`);
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
            this.logger.log('Running simulated AI extraction...');
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const mockSummary = "This is an AI-generated summary of the captured content, highlighting the most important key points.";
            const mockTopics = ["Technology", "System Design", "Artificial Intelligence"];
            const mockEntities = [
                { name: "Synora", type: "PRODUCT" },
                { name: "NestJS", type: "TECHNOLOGY" },
            ];
            this.logger.log('Saving extracted metadata to the database...');
            await this.prisma.summary.create({
                data: {
                    text: mockSummary,
                    artifactId: artifactId,
                },
            });
            for (const topic of mockTopics) {
                await this.prisma.topic.upsert({
                    where: { name: topic },
                    update: { artifacts: { connect: { id: artifactId } } },
                    create: { name: topic, artifacts: { connect: { id: artifactId } } },
                });
            }
            for (const entity of mockEntities) {
                await this.prisma.entity.upsert({
                    where: { name_type: { name: entity.name, type: entity.type } },
                    update: { artifacts: { connect: { id: artifactId } } },
                    create: { name: entity.name, type: entity.type, artifacts: { connect: { id: artifactId } } },
                });
            }
            await this.prisma.artifact.update({
                where: { id: artifactId },
                data: { status: 'completed' },
            });
            this.logger.log(`Successfully completed job ${job.id} for artifact ${artifactId}`);
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