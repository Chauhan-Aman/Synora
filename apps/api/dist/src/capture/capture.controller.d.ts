import { CaptureService } from './capture.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
export declare class CaptureController {
    private readonly captureService;
    constructor(captureService: CaptureService);
    create(createCaptureDto: CreateCaptureDto): Promise<{
        message: string;
        artifactId: string;
    }>;
}
