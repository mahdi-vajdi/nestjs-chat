import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger as TypeOrmLogger } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import {
  IPostgresConfig,
  POSTGRES_CONFIG_TOKEN,
} from '@infrastructure/database/postgres/configs/postgres.config';
import { DatabaseType } from './database-type.enum';
import { LOGGER_PROVIDER } from '../logger/provider/logger.provider';
import { env } from 'node:process';

@Module({})
export class DatabaseModule {
  static register(...dbs: DatabaseType[]): DynamicModule {
    const databaseImports = dbs.map((dbType) => {
      switch (dbType) {
        case DatabaseType.POSTGRES:
          return DatabaseModule.getPostgresConnection();
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    });

    return {
      module: DatabaseModule,
      imports: databaseImports,
    };
  }

  private static getPostgresConnection(): DynamicModule {
    return TypeOrmModule.forRootAsync({
      name: DatabaseType.POSTGRES,
      imports: [ConfigModule, LoggerModule],
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
          autoLoadEntities: true,
          migrations: ['dist/**/postgres/migrations/**/*.js'],
          migrationsRun: false,
          migrationsTableName: 'typeorm_migrations',
          synchronize: env.NODE_ENV === 'development',
          logging: postgresConfig.log,
          logger: logger,
          maxQueryExecutionTime: postgresConfig.slowQueryLimit,
        };
      },
      inject: [ConfigService, LOGGER_PROVIDER],
    });
  }
}
