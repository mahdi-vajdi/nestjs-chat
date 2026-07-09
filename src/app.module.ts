import { ChatModule } from '@chat/chat.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { httpConfig } from '@infrastructure/http/http.config';
import { winstonLoggerConfig } from '@infrastructure/logger/winston/config/winston-logger.config';
import { postgresConfig } from '@infrastructure/database/postgres/configs/postgres.config';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { redisConfig } from '@infrastructure/redis/configs/redis.config';
import { wsConfig } from '@infrastructure/websocket/ws.config';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { BroadcastModule } from '@infrastructure/websocket/broadcast/broadcast.module';
import { authConfig } from '@auth/infrastructure/configs/auth.config';
import { UserModule } from '@user/user.module';
import { AuthModule } from '@auth/auth.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DatabaseType } from '@infrastructure/database/database-type.enum';

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
    DatabaseModule.register(DatabaseType.POSTGRES),
    LoggerModule,
    RedisModule,
    BroadcastModule,
    UserModule,
    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}
