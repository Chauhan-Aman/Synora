import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('topics')
  async getTopics() {
    // Fetch all topics and include the count of artifacts for each
    const topics = await this.prisma.topic.findMany({
      include: {
        _count: {
          select: { artifacts: true }
        }
      },
      orderBy: {
        artifacts: {
          _count: 'desc'
        }
      }
    });

    return topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      count: topic._count.artifacts
    }));
  }

  @Get('entities')
  async getEntities() {
    const entities = await this.prisma.entity.findMany({
      include: {
        _count: {
          select: { artifacts: true }
        }
      },
      orderBy: {
        artifacts: {
          _count: 'desc'
        }
      }
    });

    return entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      count: entity._count.artifacts
    }));
  }
}
