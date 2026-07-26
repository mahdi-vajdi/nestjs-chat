import { Logger as TypeOrmLogger } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

export class TypeOrmLoggerAdapter implements TypeOrmLogger {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('TypeORM');
  }

  logQuery(query: string, parameters?: any[]) {
    this.logger.debug({ query, parameters }, 'Database query executed');
  }

  logQueryError(error: string | Error, query: string, parameters?: any[]) {
    this.logger.error({ error, query, parameters }, 'Database query failed');
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn(
      { time, query, parameters },
      `Slow database query (${time}ms)`,
    );
  }

  logSchemaBuild(message: string) {
    this.logger.info(message);
  }

  logMigration(message: string) {
    this.logger.info(message);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    if (level === 'log' || level === 'info') {
      this.logger.info(message);
    } else if (level === 'warn') {
      this.logger.warn(message);
    }
  }
}
