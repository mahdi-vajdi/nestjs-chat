import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigType } from '@nestjs/config';
import { httpConfig } from '@infrastructure/http/http.config';
import { wsConfig } from '@infrastructure/websocket/ws.config';
import { INestApplication, Logger } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  IRedisProvider,
  REDIS_DB0_PROVIDER,
} from '@infrastructure/redis/providers/redis.provider';
import { RedisIoAdapter } from '@infrastructure/websocket/adapter/redis/redis-io.adapter';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';

function setUpSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Chat API')
    .setVersion('1')
    .addBearerAuth({ 'x-tokenName': 'Authorization', type: 'http' }, 'Token')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup('swagger', app, swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const wsConf = app.get<ConfigType<typeof wsConfig>>(wsConfig.KEY);
  const logger = app.get(PinoLogger);
  const bootstrapLogger = new Logger('Bootstrap');

  app.useLogger(logger);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());
  setUpSwagger(app);

  // Set up adapter for socket gateway
  const redisDB0Provider =
    await app.resolve<IRedisProvider>(REDIS_DB0_PROVIDER);
  const redisIoAdapter = new RedisIoAdapter(
    wsConf,
    app,
    redisDB0Provider,
    redisDB0Provider,
  );
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  const httpConf = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
  bootstrapLogger.log(`Starting app on port ${httpConf.port}`);

  await app.listen(httpConf.port);
}

bootstrap();
