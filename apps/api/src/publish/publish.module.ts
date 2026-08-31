import { Module } from '@nestjs/common';
import { PublishController } from './publish.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublishController],
})
export class PublishModule {}
