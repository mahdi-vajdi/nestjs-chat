import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const winstonLoggerConfigSchema = z.object({
  useFile: z.coerce.boolean().default(false),
  filePath: z.string().min(1),
  level: z.enum(['debug', 'verbose', 'log', 'warn', 'error']),
});

export const winstonLoggerConfig = registerAs('winston-logger', () => {
  return winstonLoggerConfigSchema.parse({
    useFile: process.env.LOG_USE_FILE,
    filePath: process.env.LOG_FILE,
    level: process.env.LOG_LEVEL,
  });
});
