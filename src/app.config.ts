import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const appConfigSchema = z.object({
  debugMode: z.coerce.boolean().default(false),
});

export const appConfig = registerAs('app', () => {
  return appConfigSchema.parse({
    debugMode: process.env.DEBUG_MODE,
  });
});
