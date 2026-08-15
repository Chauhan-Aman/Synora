import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CaptureService } from './capture.service';
import { CreateCaptureDto } from './dto/create-capture.dto';

@Controller('capture')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted because processing is async
  create(@Body() createCaptureDto: CreateCaptureDto) {
    return this.captureService.create(createCaptureDto);
  }
}
