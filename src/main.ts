import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigType } from '@nestjs/config';
import { httpConfig } from '@infrastructure/http/http.config';
import { wsConfig } from '@infrastructure/websocket/ws.config';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisProvider } from '@infrastructure/redis/redis.provider';
import { RedisIoAdapter } from '@infrastructure/websocket/adapter/redis/redis-io.adapter';
import { GlobalHttpExceptionFilter } from '@common/http/filters/global-http-exception.filter';

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
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalHttpExceptionFilter(httpAdapterHost));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  setUpSwagger(app);

  // Set up adapter for socket gateway
  const redisProvider = await app.resolve<RedisProvider>(RedisProvider);
  const redisIoAdapter = new RedisIoAdapter(wsConf, app, redisProvider);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  const httpConf = app.get<ConfigType<typeof httpConfig>>(httpConfig.KEY);
  bootstrapLogger.log(`Starting app on port ${httpConf.port}`);

  await app.listen(httpConf.port);
}

bootstrap();
