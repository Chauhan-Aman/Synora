import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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
        topics: { select: { id: true, name: true } },
        collections: true
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
      topics: a.topics,
      collections: a.collections
    }));
  }

  @Get('collections')
  async getCollections(@CurrentUser() user: any) {
    return this.prisma.collection.findMany({
      where: { userId: user.userId },
      include: {
        artifacts: { select: { id: true, title: true, sourceUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('collections')
  async createCollection(@CurrentUser() user: any, @Body() body: { name: string }) {
    return this.prisma.collection.create({
      data: {
        name: body.name,
        userId: user.userId
      }
    });
  }

  @Post('artifacts/:id/collections')
  async addArtifactToCollection(@CurrentUser() user: any, @Param('id') artifactId: string, @Body() body: { collectionId: string }) {
    return this.prisma.artifact.update({
      where: { id: artifactId, userId: user.userId },
      data: {
        collections: {
          connect: { id: body.collectionId }
        }
      }
    });
  }

  @Get('insights')
  async getInsights(@CurrentUser() user: any) {
    return this.prisma.insight.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('insights/generate')
  async generateInsights(@CurrentUser() user: any) {
    // 1. Fetch recent artifacts to build a rich chronological context
    const artifacts = await this.prisma.artifact.findMany({
      where: { userId: user.userId, summary: { isNot: null } },
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        summary: true,
        topics: { select: { name: true } }
      }
    });

    // Reverse to chronological order for temporal tracking
    const chronologicalArtifacts = artifacts.reverse();

    let contextText = '';
    for (const a of chronologicalArtifacts) {
      const date = a.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const topicNames = a.topics.map(t => t.name).join(', ') || 'General';
      const summary = a.summary?.text || 'No summary available.';
      const title = a.title || 'Untitled';
      
      contextText += `[${date}] Title: "${title}" | Topics: [${topicNames}]\nSummary: ${summary}\n\n`;
    }

    if (contextText.length > 6000) {
      contextText = contextText.substring(0, 6000) + '... (truncated)';
    }

    const prompt = `
      You are an AI specialized in analyzing a user's personal knowledge graph to find GAPS, CONFLICTS, and EVOLUTION of ideas.
      
      Here is a chronological list of the user's recent knowledge captures:
      
      ${contextText}

      Analyze the semantic content of these summaries and identify exactly:
      1. One "GAP": A critical missing concept or bridge that connects two or more of their topics.
      2. One "CONFLICT": A contradiction, opposing viewpoint, or nuanced tension present within the captured facts/summaries.
      3. One "EVOLUTION": A temporal analysis showing how their understanding or focus on a specific topic has changed or deepened chronologically over time.

      Respond ONLY with a valid JSON array of objects matching this exact schema:
      [
        {
          "type": "GAP" | "CONFLICT" | "EVOLUTION",
          "title": "Short punchy title",
          "description": "Detailed 2-3 sentence explanation of the insight based strictly on the provided context.",
          "sources": ["Topic 1", "Topic 2", "Or Artifact Title"]
        }
      ]
    `;

    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!ollamaResponse.ok) throw new Error('Failed to generate insights');
      
      const data = await ollamaResponse.json();
      let responseText = data.response.trim();
      
      // Strip markdown codeblocks
      if (responseText.startsWith('```')) {
        const lines = responseText.split('\n');
        lines.shift(); // remove ```json
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop(); // remove closing ```
        }
        responseText = lines.join('\n');
      }

      let insightsList;
      try {
        insightsList = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse insights JSON:", responseText);
        insightsList = [];
      }
      
      if (!Array.isArray(insightsList)) {
        let extracted = [];
        for (const key in insightsList) {
          if (Array.isArray(insightsList[key])) {
            extracted.push(...insightsList[key]);
          }
        }
        insightsList = extracted;
      }

      // Save to database
      for (const insight of insightsList) {
        await this.prisma.insight.create({
          data: {
            type: insight.type || 'GAP',
            title: insight.title || 'Untitled Insight',
            description: insight.description || '',
            sources: insight.sources || [],
            userId: user.userId
          }
        });
      }

      return this.getInsights(user);
    } catch (error) {
      console.error('Insights generation failed:', error);
      throw error;
    }
  }
}
