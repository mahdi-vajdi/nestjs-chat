import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { httpConfig } from './presentation/http/http.config';
import { winstonLoggerConfig } from '@shared/logger/winston/config/winston-logger.config';
import { postgresConfig } from '@shared/database/postgres/config/postgres.config';
import { LoggerModule } from '@shared/logger/logger.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      load: [appConfig, httpConfig, winstonLoggerConfig, postgresConfig],
      cache: true,
    }),
    LoggerModule,
    PresentationModule,
  ],
})
export class AppModule {}
