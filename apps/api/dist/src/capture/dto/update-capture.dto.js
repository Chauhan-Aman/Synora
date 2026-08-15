"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCaptureDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_capture_dto_1 = require("./create-capture.dto");
class UpdateCaptureDto extends (0, mapped_types_1.PartialType)(create_capture_dto_1.CreateCaptureDto) {
}
exports.UpdateCaptureDto = UpdateCaptureDto;
//# sourceMappingURL=update-capture.dto.js.map