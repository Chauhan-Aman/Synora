import { Module } from '@nestjs/common';
import { VisualsController } from './visuals.controller';
import { VisualsService } from './visuals.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VisualsController],
  providers: [VisualsService],
})
export class VisualsModule {}
