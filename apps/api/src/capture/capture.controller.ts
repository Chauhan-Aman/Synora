import { Controller, Get, Post, Delete, Body, HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Param } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { LlmService } from '../common/llm.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('capture')
export class CaptureController {
  constructor(
    private readonly captureService: CaptureService,
    private readonly llmService: LlmService
  ) {}

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

    const translatedText = await this.llmService.generateText({
      modelType: 'DRAFTING',
      prompt: prompt
    });

    return this.captureService.updateArtifactContent(id, translatedText, user.userId);
  }

  @Post(':id/format')
  async formatDocument(@Param('id') id: string, @CurrentUser() user: any) {
    const artifact = await this.captureService.getArtifact(id, user.userId);
    if (!artifact) throw new BadRequestException('Artifact not found');

    const prompt = `You are an expert technical editor. Your task is to take the following raw scraped text and format it into a beautifully structured markdown document.

    RULES:
    1. Organize the content with clear, descriptive markdown headings (e.g., ## Introduction).
    2. Break up large walls of text into digestible paragraphs and bullet points.
    3. Preserve all technical details, logic, examples, formulas, and exact wording where possible.
    4. Remove any navigation links, ads, or irrelevant web scraping artifacts that might have slipped through.
    5. Respond ONLY with the finalized markdown article.
    
    RAW TEXT:
    ${(artifact.content ?? '').substring(0, 12000)}`;

    const formattedText = await this.llmService.generateText({
      modelType: 'DRAFTING',
      prompt: prompt
    });

    return this.captureService.updateArtifactContent(id, formattedText, user.userId);
  }

  @Post(':id/summary')
  async generateSummary(@Param('id') id: string, @CurrentUser() user: any) {
    const artifact = await this.captureService.getArtifact(id, user.userId);
    if (!artifact) throw new BadRequestException('Artifact not found');

    const prompt = `Write a concise, insightful 2-3 sentence AI summary of the following document.
    Focus only on the core concepts and the main takeaway.
    Respond ONLY with the summary text itself.
    
    DOCUMENT:
    ${artifact.content?.substring(0, 4000) || artifact.title}`;

    const summary = await this.llmService.generateText({
      modelType: 'EXTRACTION',
      prompt: prompt
    });

    return this.captureService.updateArtifactSummary(id, summary, user.userId);
  }

  @Delete(':id')
  async deleteArtifact(@Param('id') id: string, @CurrentUser() user: any) {
    return this.captureService.deleteArtifact(id, user.userId);
  }
}
