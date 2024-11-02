import { ConfigFactory, registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface IPostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  log: boolean;
  slowQueryLimit?: number;
}

export const POSTGRES_CONFIG_TOKEN = 'postgres-config-token';

const postgresConfigSchema = Joi.object<IPostgresConfig>({
  host: Joi.string().required(),
  port: Joi.number().port().required(),
  username: Joi.string().required(),
  password: Joi.string().allow('').required(),
  database: Joi.string().required(),
  log: Joi.boolean().default(false),
  slowQueryLimit: Joi.number().optional(),
});

export const postgresConfig = registerAs<
  IPostgresConfig,
  ConfigFactory<IPostgresConfig>
>(POSTGRES_CONFIG_TOKEN, () => {
  const { error, value } = postgresConfigSchema.validate({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    log: process.env.POSTGRES_LOG,
    slowQueryLimit: process.env.POSTGRES_SLOW_QUERY_LIMIT
      ? parseInt(process.env.POSTGRES_SLOW_QUERY_LIMIT, 10)
      : undefined,
  });

  if (error) {
    throw new Error(`Postgres config env validation error: ${error.message}`);
  }

  return value;
});
