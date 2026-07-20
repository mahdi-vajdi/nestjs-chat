import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const postgresConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().min(1).max(65535),
  username: z.string().min(1),
  password: z.string(),
  database: z.string().min(1),
  log: z.coerce.boolean().default(false),
  slowQueryLimit: z.coerce.number().optional(),
});

export const postgresConfig = registerAs('postgres', () => {
  return postgresConfigSchema.parse({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DATABASE,
    log: process.env.POSTGRES_LOG,
    slowQueryLimit: process.env.POSTGRES_SLOW_QUERY_LIMIT,
  });
});
