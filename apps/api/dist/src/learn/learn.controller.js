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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearnController = void 0;
const common_1 = require("@nestjs/common");
const learn_service_1 = require("./learn.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const learn_cron_service_1 = require("./learn.cron.service");
let LearnController = class LearnController {
    learnService;
    learnCronService;
    constructor(learnService, learnCronService) {
        this.learnService = learnService;
        this.learnCronService = learnCronService;
    }
    async triggerCron() {
        this.learnCronService.handleDailySpacedRepetition();
        return { status: 'Cron job triggered in background' };
    }
    async getDueFlashcards(user) {
        return this.learnService.getDueFlashcards(user.userId);
    }
    async reviewFlashcard(user, id, score) {
        return this.learnService.reviewFlashcard(user.userId, id, score);
    }
};
exports.LearnController = LearnController;
__decorate([
    (0, common_1.Post)('trigger-cron'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LearnController.prototype, "triggerCron", null);
__decorate([
    (0, common_1.Get)('due'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LearnController.prototype, "getDueFlashcards", null);
__decorate([
    (0, common_1.Post)('review/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('score')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], LearnController.prototype, "reviewFlashcard", null);
exports.LearnController = LearnController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('learn'),
    __metadata("design:paramtypes", [learn_service_1.LearnService,
        learn_cron_service_1.LearnCronService])
], LearnController);
//# sourceMappingURL=learn.controller.js.map