import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('capture')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body() createCaptureDto: CreateCaptureDto, @CurrentUser() user: any) {
    return this.captureService.create(createCaptureDto, user.userId);
  }
}
