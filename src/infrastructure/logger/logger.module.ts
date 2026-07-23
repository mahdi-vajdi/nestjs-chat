import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config/logger.config';
import { ConfigurableModuleClass } from './logger.module-definition';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(loggerConfig)],
      inject: [loggerConfig.KEY],
      useFactory: (config: ConfigType<typeof loggerConfig>) => {
        const pinoHttp: any = {
          level: config.level,
        };

        if (config.useFile) {
          pinoHttp.transport = {
            target: 'pino/file',
            options: { destination: config.filePath },
          };
        } else {
          pinoHttp.transport = {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          };
        }

        return { pinoHttp };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule extends ConfigurableModuleClass {}
