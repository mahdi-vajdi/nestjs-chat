import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Logger as TypeOrmLogger } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { postgresConfig } from '@infrastructure/database/postgres/configs/postgres.config';
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
        dbConfig: ConfigType<typeof postgresConfig>,
        logger: TypeOrmLogger,
      ) => {
        return {
          name: DatabaseType.POSTGRES, // Do not delete. Used in application shutdown.
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          autoLoadEntities: true,
          migrations: ['dist/**/postgres/migrations/**/*.js'],
          migrationsRun: env.NODE_ENV === 'development',
          migrationsTableName: 'typeorm_migrations',
          synchronize: false,
          logging: dbConfig.log,
          logger: logger,
          maxQueryExecutionTime: dbConfig.slowQueryLimit,
        };
      },
      inject: [postgresConfig.KEY, LOGGER_PROVIDER],
    });
  }
}
