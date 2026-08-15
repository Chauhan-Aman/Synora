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

  @Get('graph')
  async getGraph() {
    const artifacts = await this.prisma.artifact.findMany({
      include: { topics: true, entities: true },
      where: { status: 'completed' }
    });

    const nodes = [];
    const links = [];
    const addedNodes = new Set();

    for (const artifact of artifacts) {
      let artifactName = 'Raw Text Snippet';
      if (artifact.sourceUrl) {
        try {
          const url = new URL(artifact.sourceUrl);
          artifactName = url.hostname;
        } catch {
          artifactName = artifact.sourceUrl.length > 30 ? artifact.sourceUrl.substring(0, 30) + '...' : artifact.sourceUrl;
        }
      }

      if (!addedNodes.has(artifact.id)) {
        nodes.push({ id: artifact.id, name: artifactName, group: 'artifact' });
        addedNodes.add(artifact.id);
      }

      for (const topic of artifact.topics) {
        if (!addedNodes.has(topic.id)) {
          nodes.push({ id: topic.id, name: topic.name, group: 'topic' });
          addedNodes.add(topic.id);
        }
        links.push({ source: topic.id, target: artifact.id });
      }

      for (const entity of artifact.entities) {
        if (!addedNodes.has(entity.id)) {
          nodes.push({ id: entity.id, name: entity.name, group: 'entity' });
          addedNodes.add(entity.id);
        }
        links.push({ source: artifact.id, target: entity.id });
      }
    }

    return { nodes, links };
  }
}
