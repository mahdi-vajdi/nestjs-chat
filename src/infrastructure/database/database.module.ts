import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Logger as TypeOrmLogger } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { postgresConfig } from '@infrastructure/database/postgres/config/postgres.config';
import { DatabaseType } from './database-type.enum';
import { LOGGER_PROVIDER } from '../logger/provider/logger.provider';

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
      imports: [ConfigModule.forFeature(postgresConfig), LoggerModule],
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
          schema: dbConfig.schema,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
          extra: {
            max: dbConfig.poolSize,
            application_name: dbConfig.applicationName,
          },
          autoLoadEntities: true,
          migrations: ['dist/**/postgres/migrations/**/*.js'],
          migrationsRun: false,
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
