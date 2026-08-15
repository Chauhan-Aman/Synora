import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('capture')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body() createCaptureDto: CreateCaptureDto, @CurrentUser() user: any) {
    return this.captureService.create(createCaptureDto, user.userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  @HttpCode(HttpStatus.ACCEPTED)
  uploadFile(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Determine type based on mime
    let type = 'TEXT';
    if (file.mimetype === 'application/pdf') {
      type = 'PDF';
    } else if (file.mimetype.startsWith('image/')) {
      type = 'IMAGE';
    }
    
    const dto: CreateCaptureDto = {
      type: type,
      content: file.path, // save the local path to content
      sourceUrl: file.originalname // store original name here for the frontend UI
    };
    
    return this.captureService.create(dto, user.userId);
  }
}
