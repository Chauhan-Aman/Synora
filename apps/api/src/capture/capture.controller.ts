import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Param } from '@nestjs/common';
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

  @Post(':id/translate')
  async translateToEnglish(@Param('id') id: string, @CurrentUser() user: any) {
    const artifact = await this.captureService.getArtifact(id, user.userId);
    if (!artifact) throw new BadRequestException('Artifact not found');

    const prompt = `You are an expert technical writer and editor. Your task is to rewrite the following raw transcript into a highly readable, well-structured, and comprehensive article in English.

    RULES:
    1. Organize the content with clear, descriptive markdown headings (e.g., ## Introduction, ## Main Concepts).
    2. Remove all verbal tics, repetitions, and conversational filler (e.g., "Hello viewers", "If you remember", "Okay let's talk about").
    3. Break up large walls of text into digestible paragraphs and bullet points.
    4. Preserve all technical details, logic, examples, and formulas.
    5. Translate to English if the original text is in another language.
    6. Respond ONLY with the finalized markdown article. Do not add conversational filler.
    
    RAW TRANSCRIPT:
    ${artifact.content}`;

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: prompt,
        stream: false
      })
    });

    const data = await res.json();
    const translatedText = data.response;

    return this.captureService.updateArtifactContent(id, translatedText, user.userId);
  }
}
