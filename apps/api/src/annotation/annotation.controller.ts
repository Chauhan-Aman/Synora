import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AnnotationService } from './annotation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('annotations')
export class AnnotationController {
  constructor(private readonly annotationService: AnnotationService) {}

  @Get('artifact/:artifactId')
  async getAnnotations(
    @Param('artifactId') artifactId: string,
    @CurrentUser() user: any
  ) {
    return this.annotationService.getAnnotationsForArtifact(user.userId, artifactId);
  }

  @Post('artifact/:artifactId')
  async addAnnotation(
    @Param('artifactId') artifactId: string,
    @Body('text') text: string,
    @CurrentUser() user: any
  ) {
    return this.annotationService.addAnnotation(user.userId, artifactId, text);
  }

  @Delete(':id')
  async deleteAnnotation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.annotationService.deleteAnnotation(user.userId, id);
  }
}
