import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const baseSchema = z.object({
  level: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

const loggerConfigSchema = z.discriminatedUnion('useFile', [
  baseSchema.extend({
    useFile: z.literal(true),
    filePath: z.string().min(1),
  }),
  baseSchema.extend({
    useFile: z.literal(false),
  }),
]);

export const loggerConfig = registerAs('logger', () => {
  const useFileStr = process.env.LOG_USE_FILE;
  return loggerConfigSchema.parse({
    useFile: useFileStr === 'true' || useFileStr === '1',
    filePath: process.env.LOG_FILE,
    level: process.env.LOG_LEVEL || 'info',
  });
});
