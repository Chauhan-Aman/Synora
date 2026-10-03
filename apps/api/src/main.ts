import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.FRONTEND_URL) {
    app.enableCors({ origin: process.env.FRONTEND_URL });
  } else {
    app.enableCors(); // fallback for local dev
  }
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
