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
exports.CreateController = void 0;
const common_1 = require("@nestjs/common");
const create_service_1 = require("./create.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let CreateController = class CreateController {
    createService;
    constructor(createService) {
        this.createService = createService;
    }
    async fetchContext(draft, user) {
        const context = await this.createService.fetchContext(draft, user.userId);
        return { context };
    }
    async generateParagraph(draft, context, user, model) {
        const nextParagraph = await this.createService.generateParagraph(draft, context, model);
        return { nextParagraph };
    }
    async rewriteParagraph(draft, suggestedParagraph, instructions, context, user, model) {
        const nextParagraph = await this.createService.rewriteParagraph(draft, suggestedParagraph, instructions, context, model);
        return { nextParagraph };
    }
};
exports.CreateController = CreateController;
__decorate([
    (0, common_1.Post)('context'),
    __param(0, (0, common_1.Body)('draft')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CreateController.prototype, "fetchContext", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)('draft')),
    __param(1, (0, common_1.Body)('context')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object, String]),
    __metadata("design:returntype", Promise)
], CreateController.prototype, "generateParagraph", null);
__decorate([
    (0, common_1.Post)('rewrite'),
    __param(0, (0, common_1.Body)('draft')),
    __param(1, (0, common_1.Body)('suggestedParagraph')),
    __param(2, (0, common_1.Body)('instructions')),
    __param(3, (0, common_1.Body)('context')),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __param(5, (0, common_1.Body)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array, Object, String]),
    __metadata("design:returntype", Promise)
], CreateController.prototype, "rewriteParagraph", null);
exports.CreateController = CreateController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('create'),
    __metadata("design:paramtypes", [create_service_1.CreateService])
], CreateController);
//# sourceMappingURL=create.controller.js.map