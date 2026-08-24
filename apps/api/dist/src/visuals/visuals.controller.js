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
exports.VisualsController = void 0;
const common_1 = require("@nestjs/common");
const visuals_service_1 = require("./visuals.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let VisualsController = class VisualsController {
    visualsService;
    constructor(visualsService) {
        this.visualsService = visualsService;
    }
    async generateDiagram(body, req) {
        return { diagram: await this.visualsService.generateDiagram(body.text, body.type || 'mindmap') };
    }
    async generateCoverTheme(body, req) {
        return await this.visualsService.generateCoverTheme(body.title, body.content);
    }
};
exports.VisualsController = VisualsController;
__decorate([
    (0, common_1.Post)('diagram'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VisualsController.prototype, "generateDiagram", null);
__decorate([
    (0, common_1.Post)('cover-theme'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VisualsController.prototype, "generateCoverTheme", null);
exports.VisualsController = VisualsController = __decorate([
    (0, common_1.Controller)('visuals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [visuals_service_1.VisualsService])
], VisualsController);
//# sourceMappingURL=visuals.controller.js.map