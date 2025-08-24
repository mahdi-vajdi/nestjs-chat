import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HTTP_CONFIG_TOKEN, IHttpConfig } from '@presentation/http/http.config';
import { INestApplication, Logger, LoggerService } from '@nestjs/common';
import { LOGGER_PROVIDER } from '@infrastructure/logger/provider/logger.provider';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  IRedisProvider,
  REDIS_DB0_PROVIDER,
} from '@infrastructure/redis/providers/redis.provider';
import { RedisIoAdapter } from '@infrastructure/websocket/adapter/redis/redis-io.adapter';
import {
  BROADCAST_PROVIDER,
  BroadcastProvider,
} from '@infrastructure/websocket/broadcast/providers/broadcast.provider';

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

  const configService = app.get(ConfigService);
  const logger = app.get<LoggerService>(LOGGER_PROVIDER);
  const bootstrapLogger = new Logger('Bootstrap');

  app.useLogger(logger);
  app.enableCors();
  setUpSwagger(app);

  // Set up adapter for socket gateway
  const redisDB0Provider =
    await app.resolve<IRedisProvider>(REDIS_DB0_PROVIDER);
  const broadcastProvider =
    await app.resolve<BroadcastProvider>(BROADCAST_PROVIDER);
  const redisIoAdapter = new RedisIoAdapter(
    configService,
    app,
    redisDB0Provider,
    redisDB0Provider,
    broadcastProvider,
  );
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  const httpConfig = configService.get<IHttpConfig>(HTTP_CONFIG_TOKEN);
  bootstrapLogger.log(`Starting app on port ${httpConfig.port}`);

  await app.listen(httpConfig.port);
}

bootstrap();
