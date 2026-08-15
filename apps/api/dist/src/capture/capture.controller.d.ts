import { CaptureService } from './capture.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
export declare class CaptureController {
    private readonly captureService;
    constructor(captureService: CaptureService);
    create(createCaptureDto: CreateCaptureDto, user: any): Promise<{
        message: string;
        artifactId: string;
    }>;
    uploadFile(file: Express.Multer.File, user: any): Promise<{
        message: string;
        artifactId: string;
    }>;
}
