import { ChatModule } from '@modules/chat/chat.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { httpConfig } from '@infrastructure/http/http.config';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { wsConfig } from '@infrastructure/websocket/ws.config';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DatabaseType } from '@infrastructure/database/database-type.enum';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, httpConfig, wsConfig],
      cache: true,
    }),
    DatabaseModule.register(DatabaseType.POSTGRES),
    LoggerModule,
    RedisModule,
    UserModule,
    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}
