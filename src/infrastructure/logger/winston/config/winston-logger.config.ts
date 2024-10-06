import { ConfigFactory, registerAs } from '@nestjs/config';

export interface IWinstonLoggerConfig {
  useFile: boolean;
  filePath: string;
  level: string;
}

export const WINSTON_LOGGER_CONFIG_TOKEN = 'winston-logger-config-token';

export const winstonLoggerConfig = registerAs<
  IWinstonLoggerConfig,
  ConfigFactory<IWinstonLoggerConfig>
>(WINSTON_LOGGER_CONFIG_TOKEN, () => {
  if (!process.env.LOG_FILE) throw new Error('LOG_FILE not provided.');

  return {
    useFile: process.env.LOG_USE_FILE === 'true',
    filePath: process.env.LOG_FILE,
    level: process.env.LOG_LEVEL ?? 'warn',
  };
});
