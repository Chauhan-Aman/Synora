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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CaptureService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptureService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
let CaptureService = CaptureService_1 = class CaptureService {
    prisma;
    captureQueue;
    logger = new common_1.Logger(CaptureService_1.name);
    constructor(prisma, captureQueue) {
        this.prisma = prisma;
        this.captureQueue = captureQueue;
    }
    async create(createCaptureDto) {
        const artifact = await this.prisma.artifact.create({
            data: {
                type: createCaptureDto.type,
                sourceUrl: createCaptureDto.sourceUrl,
                content: createCaptureDto.content,
                status: 'pending',
            },
        });
        await this.captureQueue.add('process-capture', {
            artifactId: artifact.id,
        });
        this.logger.log(`Received capture and queued for processing: ${artifact.id}`);
        return {
            message: 'Capture received and queued for processing',
            artifactId: artifact.id,
        };
    }
};
exports.CaptureService = CaptureService;
exports.CaptureService = CaptureService = CaptureService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('capture-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], CaptureService);
//# sourceMappingURL=capture.service.js.map