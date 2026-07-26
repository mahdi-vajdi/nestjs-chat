import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const httpConfigSchema = z.object({
  port: z.coerce.number().min(1).max(65535),
});

export const httpConfig = registerAs('http', () => {
  return httpConfigSchema.parse({
    port: process.env.PORT,
  });
});
