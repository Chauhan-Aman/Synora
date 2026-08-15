import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('capture-processing')
export class InferenceProcessor extends WorkerHost {
  private readonly logger = new Logger(InferenceProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { artifactId } = job.data;
    this.logger.log(`Processing job ${job.id} for artifact ${artifactId}`);

    // Update status to processing
    await this.prisma.artifact.update({
      where: { id: artifactId },
      data: { status: 'processing' },
    });

    // Simulate AI inference delay (e.g. calling OpenAI)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update status to completed
    await this.prisma.artifact.update({
      where: { id: artifactId },
      data: { status: 'completed' },
    });

    this.logger.log(`Successfully completed job ${job.id} for artifact ${artifactId}`);
  }
}
