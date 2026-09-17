import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnotationService {
  private readonly logger = new Logger(AnnotationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAnnotationsForArtifact(userId: string, artifactId: string) {
    return this.prisma.annotation.findMany({
      where: { userId, artifactId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addAnnotation(userId: string, artifactId: string, text: string) {
    return this.prisma.annotation.create({
      data: {
        text,
        userId,
        artifactId
      }
    });
  }

  async deleteAnnotation(userId: string, annotationId: string) {
    return this.prisma.annotation.deleteMany({
      where: { id: annotationId, userId }
    });
  }
}
