import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  HTTP_CONFIG_TOKEN,
  httpConfig,
  IHttpConfig,
} from '@presentation/http/http.config';
import { INestApplication, Logger, LoggerService } from '@nestjs/common';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { WinstonLoggerService } from '@infrastructure/logger/winston/winston-logger.service';
import { LOGGER_PROVIDER } from '@infrastructure/logger/provider/logger.provider';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  IRedisProvider,
  REDIS_DB0_PROVIDER,
} from '@infrastructure/redis/providers/redis.provider';
import { RedisIoAdapter } from '@infrastructure/websocket/adapter/redis/redis-io.adapter';
import {
  BROADCAST_PROVIDER,
  IBroadcastProvider,
} from '@infrastructure/websocket/broadcast/providers/broadcast.provider';
import { redisConfig } from '@infrastructure/redis/configs/redis.config';
import { wsConfig } from '@presentation/ws/ws.config';

async function loadConfig(): Promise<ConfigService> {
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [httpConfig, redisConfig, wsConfig],
    }),
  );

  return appContext.get<ConfigService>(ConfigService);
}

async function loadLogger(): Promise<LoggerService> {
  const appContext = await NestFactory.createApplicationContext(LoggerModule);

  return appContext.get<WinstonLoggerService>(LOGGER_PROVIDER);
}

function setUpSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chatterbox API Gateway')
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
  const configService = await loadConfig();
  const appLogger = await loadLogger();
  const bootstrapLogger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: appLogger,
  });

  app.enableCors();

  setUpSwagger(app);

  // Set up adapter for socket gateway
  const redisDB0ProviderPub =
    await app.resolve<IRedisProvider>(REDIS_DB0_PROVIDER);
  const redisDB0ProviderSub =
    await app.resolve<IRedisProvider>(REDIS_DB0_PROVIDER);
  const broadcastProvider =
    await app.resolve<IBroadcastProvider>(BROADCAST_PROVIDER);
  const redisIoAdapter = new RedisIoAdapter(
    configService,
    app,
    redisDB0ProviderPub,
    redisDB0ProviderSub,
    broadcastProvider,
  );
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.init();

  const httpConfig = configService.get<IHttpConfig>(HTTP_CONFIG_TOKEN);
  bootstrapLogger.log(`App is running on port ${httpConfig.port}`);

  await app.listen(httpConfig.port);
}

bootstrap();
