import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OshxonaPOS-CloudAPI');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });

  const config = new DocumentBuilder()
    .setTitle('☁️ OshxonaPOS — Cloud API')
    .setDescription('Bulut serveri sinxronizatsiya va masofaviy boshqaruv API')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.CLOUD_PORT || 5000;
  await app.listen(port);

  logger.log(`☁️ OshxonaPOS Cloud API ishga tushdi: http://localhost:${port}/api`);
  logger.log(`📖 Bulut Swagger: http://localhost:${port}/docs`);
}

bootstrap();
