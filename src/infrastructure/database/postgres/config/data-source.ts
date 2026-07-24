import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { postgresConfigSchema } from './postgres.config';

dotenv.config();

const dbConfig = postgresConfigSchema.parse({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  schema: process.env.POSTGRES_SCHEMA,
  log: process.env.POSTGRES_LOG,
  slowQueryLimit: process.env.POSTGRES_SLOW_QUERY_LIMIT,
  ssl: process.env.POSTGRES_SSL,
  applicationName: process.env.POSTGRES_APPLICATION_NAME,
  poolSize: process.env.POSTGRES_POOL_SIZE,
});

export const AppDataSource = new DataSource({
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
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/modules/*/infrastructure/database/migrations/**/*.js'],
  synchronize: false,
  logging: dbConfig.log,
});
