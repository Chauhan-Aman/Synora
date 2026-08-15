import { Module } from '@nestjs/common';
import { InferenceProcessor } from './inference.processor/inference.processor';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InferenceProcessor],
})
export class InferenceModule {}
