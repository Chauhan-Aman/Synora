import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KnowledgeController]
})
export class KnowledgeModule {}
