import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { httpConfig } from '@presentation/http/http.config';
import { winstonLoggerConfig } from '@infrastructure/logger/winston/config/winston-logger.config';
import { postgresConfig } from '@infrastructure/database/postgres/configs/postgres.config';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { PresentationModule } from '@presentation/presentation.module';
import { redisConfig } from '@infrastructure/redis/configs/redis.config';
import { wsConfig } from '@presentation/ws/ws.config';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { BroadcastModule } from '@infrastructure/websocket/broadcast/broadcast.module';
import { authConfig } from '@auth/configs/auth.config';
import { UserModule } from '@user/user.module';
import { AuthModule } from '@auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      load: [
        appConfig,
        httpConfig,
        winstonLoggerConfig,
        postgresConfig,
        redisConfig,
        wsConfig,
        authConfig,
      ],
      cache: true,
    }),
    LoggerModule,
    PresentationModule,
    RedisModule,
    BroadcastModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
