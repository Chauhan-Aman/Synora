import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('topics')
  async getTopics(@CurrentUser() user: any) {
    const topics = await this.prisma.topic.findMany({
      where: { userId: user.userId },
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
  async getEntities(@CurrentUser() user: any) {
    const entities = await this.prisma.entity.findMany({
      where: { userId: user.userId },
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
  async getGraph(@CurrentUser() user: any) {
    const artifacts = await this.prisma.artifact.findMany({
      where: { 
        userId: user.userId,
        status: 'completed' 
      },
      include: { topics: true, entities: true, summary: true }
    });

    const nodes = [];
    const links = [];
    const addedNodes = new Set();

    for (const artifact of artifacts) {
      let artifactName = 'Raw Text Snippet';
      
      if (artifact.summary && artifact.summary.text) {
        artifactName = artifact.summary.text.length > 35 
          ? artifact.summary.text.substring(0, 35) + '...' 
          : artifact.summary.text;
      } else if (artifact.sourceUrl) {
        try {
          const url = new URL(artifact.sourceUrl);
          artifactName = url.hostname;
        } catch {
          artifactName = artifact.sourceUrl.length > 30 ? artifact.sourceUrl.substring(0, 30) + '...' : artifact.sourceUrl;
        }
      }

      if (!addedNodes.has(artifact.id)) {
        nodes.push({ 
          id: artifact.id, 
          name: artifactName, 
          group: 'artifact',
          details: artifact.summary?.text,
          sourceUrl: artifact.sourceUrl
        });
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

  @Get('artifacts')
  async getArtifacts(@CurrentUser() user: any) {
    const artifacts = await this.prisma.artifact.findMany({
      where: { userId: user.userId },
      include: {
        summary: true,
        topics: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return artifacts.map(a => ({
      id: a.id,
      title: a.title,
      sourceUrl: a.sourceUrl,
      type: a.type,
      status: a.status,
      content: a.content,
      summary: a.summary?.text,
      createdAt: a.createdAt,
      topics: a.topics
    }));
  }
}
