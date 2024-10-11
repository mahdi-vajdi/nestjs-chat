import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger as TypeOrmLogger } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import {
  IPostgresConfig,
  POSTGRES_CONFIG_TOKEN,
} from './postgres/config/postgres.config';
import { DatabaseType } from './database-type.enum';
import { LOGGER_PROVIDER } from '../logger/provider/logger.provider';

@Module({})
export class DatabaseModule {
  static register(...dbs: DatabaseType[]): DynamicModule {
    const imports: any[] = [ConfigModule];

    const postgresImport = TypeOrmModule.forRootAsync({
      imports: [ConfigModule, LoggerModule],
      name: DatabaseType.POSTGRES,
      useFactory: async (
        configService: ConfigService,
        logger: TypeOrmLogger,
      ) => {
        const postgresConfig = configService.get<IPostgresConfig>(
          POSTGRES_CONFIG_TOKEN,
        );

        return {
          type: 'postgres',
          host: postgresConfig.host,
          port: postgresConfig.port,
          username: postgresConfig.username,
          password: postgresConfig.password,
          database: postgresConfig.database,
          entities: ['**/dist/**/postgres/**/*.entity{.ts,.js}'],
          migrations: ['**/dist/**/postgres/**/**.migration{.ts,.js}'],
          migrationsRun: true,
          synchronize: false,
          logging: postgresConfig.log,
          logger: logger,
          maxQueryExecutionTime: postgresConfig.slowQueryLimit,
        };
      },
      inject: [ConfigService, LOGGER_PROVIDER],
    });

    if (dbs.includes(DatabaseType.POSTGRES)) imports.push(postgresImport);

    // If no db type is specified, we push all the created connections into the imports array
    if (dbs.length === 0) imports.push(postgresImport);

    return {
      module: DatabaseModule,
      imports: imports,
    };
  }
}
