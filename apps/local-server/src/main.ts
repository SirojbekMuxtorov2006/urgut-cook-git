import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OshxonaPOS-LocalServer');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS yoqish (lokal tarmoq, Electron, web panel uchun)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // DTO validatsiyasi
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger hujjati
  const config = new DocumentBuilder()
    .setTitle('🍽️ OshxonaPOS — Lokal Server API')
    .setDescription('Restoran va Oshxona boshqaruv tizimi (Lokal Server API spetsifikatsiyasi)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 OshxonaPOS Lokal Server ishga tushdi: http://localhost:${port}/api`);
  logger.log(`📖 Swagger API hujjati: http://localhost:${port}/docs`);
}

bootstrap();
