"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LearnCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearnCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let LearnCronService = LearnCronService_1 = class LearnCronService {
    prisma;
    logger = new common_1.Logger(LearnCronService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleDailySpacedRepetition() {
        this.logger.log('Running daily SM-2 Spaced Repetition Cron Job...');
        const today = new Date();
        const dueFlashcards = await this.prisma.flashcard.findMany({
            where: {
                nextReviewDate: {
                    lte: today
                }
            }
        });
        this.logger.log(`Found ${dueFlashcards.length} flashcards due for review.`);
        const users = await this.prisma.user.findMany();
        for (const user of users) {
            const topics = await this.prisma.topic.findMany({
                where: { userId: user.id },
                include: { artifacts: { include: { chunks: true } } }
            });
            if (topics.length === 0)
                continue;
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            this.logger.log(`Generating daily reinforcement flashcard for user ${user.id} on topic: ${randomTopic.name}`);
            const contextText = randomTopic.artifacts
                .flatMap(a => a.chunks)
                .slice(0, 5)
                .map(c => c.text)
                .join('\n\n');
            if (!contextText)
                continue;
            const prompt = `
        You are a tutor creating flashcards for spaced repetition.
        The user is studying the topic: "${randomTopic.name}".
        
        Using ONLY the following context, generate 1 highly specific Question & Answer flashcard to test their knowledge.
        DO NOT include markdown formatting outside the JSON.
        
        CONTEXT:
        ${contextText}
        
        Respond with ONLY a valid JSON object matching this schema:
        {
          "question": "A specific question",
          "answer": "The specific factual answer"
        }
      `;
            try {
                const ollamaRes = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama3.2',
                        prompt: prompt,
                        stream: false,
                        format: 'json'
                    })
                });
                if (ollamaRes.ok) {
                    const data = await ollamaRes.json();
                    const parsed = JSON.parse(data.response);
                    if (parsed.question && parsed.answer) {
                        await this.prisma.flashcard.create({
                            data: {
                                question: parsed.question,
                                answer: parsed.answer,
                                userId: user.id,
                                artifactId: randomTopic.artifacts[0].id
                            }
                        });
                        this.logger.log(`Successfully generated new flashcard: ${parsed.question}`);
                    }
                }
            }
            catch (err) {
                this.logger.error(`Failed to generate flashcard: ${err.message}`);
            }
        }
        this.logger.log('Daily Spaced Repetition Cron Job completed.');
    }
};
exports.LearnCronService = LearnCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LearnCronService.prototype, "handleDailySpacedRepetition", null);
exports.LearnCronService = LearnCronService = LearnCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LearnCronService);
//# sourceMappingURL=learn.cron.service.js.map