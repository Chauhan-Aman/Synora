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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearnService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LearnService = class LearnService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDueFlashcards(userId) {
        const today = new Date();
        return this.prisma.flashcard.findMany({
            where: {
                userId,
                nextReviewDate: {
                    lte: today,
                },
            },
            orderBy: {
                nextReviewDate: 'asc',
            },
            take: 20,
        });
    }
    async reviewFlashcard(userId, flashcardId, score) {
        const card = await this.prisma.flashcard.findUnique({
            where: { id: flashcardId },
        });
        if (!card || card.userId !== userId) {
            throw new common_1.NotFoundException('Flashcard not found');
        }
        let { interval, easeFactor, repetitions } = card;
        if (score >= 3) {
            if (repetitions === 0) {
                interval = 1;
            }
            else if (repetitions === 1) {
                interval = 6;
            }
            else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
        }
        else {
            repetitions = 0;
            interval = 1;
        }
        easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
        if (easeFactor < 1.3)
            easeFactor = 1.3;
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        return this.prisma.flashcard.update({
            where: { id: flashcardId },
            data: {
                interval,
                easeFactor,
                repetitions,
                nextReviewDate,
            },
        });
    }
};
exports.LearnService = LearnService;
exports.LearnService = LearnService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LearnService);
//# sourceMappingURL=learn.service.js.map