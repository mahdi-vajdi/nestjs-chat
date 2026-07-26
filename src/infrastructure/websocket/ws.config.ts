import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const wsConfigSchema = z.object({
  port: z.coerce.number().min(1).max(65535),
});

export const wsConfig = registerAs('ws', () => {
  return wsConfigSchema.parse({
    port: process.env.WEBSOCKET_PORT,
  });
});
