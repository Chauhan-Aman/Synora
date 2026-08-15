"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptureModule = void 0;
const common_1 = require("@nestjs/common");
const capture_service_1 = require("./capture.service");
const capture_controller_1 = require("./capture.controller");
const bullmq_1 = require("@nestjs/bullmq");
const prisma_module_1 = require("../prisma/prisma.module");
let CaptureModule = class CaptureModule {
};
exports.CaptureModule = CaptureModule;
exports.CaptureModule = CaptureModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bullmq_1.BullModule.registerQueue({
                name: 'capture-processing',
            }),
        ],
        controllers: [capture_controller_1.CaptureController],
        providers: [capture_service_1.CaptureService],
    })
], CaptureModule);
//# sourceMappingURL=capture.module.js.map