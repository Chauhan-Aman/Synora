import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    if (createCaptureDto.type === 'URL' && createCaptureDto.sourceUrl) {
      try {
        const testRes = await fetch(createCaptureDto.sourceUrl, { method: 'GET' });
        if (!testRes.ok && testRes.status !== 403 && testRes.status !== 401) {
          throw new Error(`HTTP error! status: ${testRes.status}`);
        }
      } catch (err) {
        throw new BadRequestException('Failed to fetch the URL. Please verify the link is correct and accessible.');
      }
    }

    // 1. Save to DB with 'pending' status
    const artifact = await this.prisma.artifact.create({
      data: {
        type: createCaptureDto.type,
        title: createCaptureDto.title,
        sourceUrl: createCaptureDto.sourceUrl,
        content: createCaptureDto.content,
        status: 'pending',
        userId: userId,
      },
    });

    // 2. Dispatch to Queue for async processing
    await this.captureQueue.add('process-capture', {
      artifactId: artifact.id,
      model: createCaptureDto.model
    });

    this.logger.log(`Received capture and queued for processing: ${artifact.id}`);

    return {
      message: 'Capture received and queued for processing',
      artifactId: artifact.id,
    };
  }

  async update(id: string, updateDto: Partial<CreateCaptureDto>, userId: string) {
    // 1. Update in DB and reset status to pending so it gets reprocessed
    const artifact = await this.prisma.artifact.update({
      where: { id, userId },
      data: {
        title: updateDto.title,
        content: updateDto.content,
        status: 'pending',
      },
    });

    // 2. Clear old chunks since the content changed
    await this.prisma.chunk.deleteMany({
      where: { artifactId: id, userId }
    });

    // 3. Dispatch to Queue for async processing
    await this.captureQueue.add('process-capture', {
      artifactId: artifact.id,
      model: updateDto.model
    });

    this.logger.log(`Updated capture and queued for re-processing: ${artifact.id}`);

    return {
      message: 'Capture updated and queued for processing',
      artifactId: artifact.id,
    };
  }
  async getArtifact(id: string, userId: string) {
    return this.prisma.artifact.findUnique({
      where: { id, userId }
    });
  }

  async updateArtifactContent(id: string, newContent: string, userId: string) {
    return this.prisma.artifact.update({
      where: { id, userId },
      data: { content: newContent }
    });
  }

  async updateArtifactSummary(id: string, newSummary: string, userId: string) {
    return this.prisma.artifact.update({
      where: { id, userId },
      data: {
        summary: {
          upsert: {
            create: { text: newSummary, userId },
            update: { text: newSummary }
          }
        }
      },
      include: {
        summary: true
      }
    });
  }

  async renameArtifact(id: string, title: string, userId: string) {
    return this.prisma.artifact.update({
      where: { id, userId },
      data: { title },
    });
  }

  async deleteArtifact(id: string, userId: string) {
    return this.prisma.artifact.deleteMany({
      where: { id, userId }
    });
  }
}
