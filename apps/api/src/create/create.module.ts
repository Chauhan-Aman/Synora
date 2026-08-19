import { Module } from '@nestjs/common';
import { CreateService } from './create.service';
import { CreateController } from './create.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CreateController],
  providers: [CreateService],
})
export class CreateModule {}
