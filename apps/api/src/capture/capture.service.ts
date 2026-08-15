import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaptureDto } from './dto/create-capture.dto';

@Injectable()
export class CaptureService {
  private readonly logger = new Logger(CaptureService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('capture-processing') private captureQueue: Queue,
  ) {}

  async create(createCaptureDto: CreateCaptureDto, userId: string) {
    // 1. Save to DB with 'pending' status
    const artifact = await this.prisma.artifact.create({
      data: {
        type: createCaptureDto.type,
        sourceUrl: createCaptureDto.sourceUrl,
        content: createCaptureDto.content,
        status: 'pending',
        userId: userId,
      },
    });

    // 2. Dispatch to Queue for async processing
    await this.captureQueue.add('process-capture', {
      artifactId: artifact.id,
    });

    this.logger.log(`Received capture and queued for processing: ${artifact.id}`);

    return {
      message: 'Capture received and queued for processing',
      artifactId: artifact.id,
    };
  }
}
