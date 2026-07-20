import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import * as fs from 'fs';

const authConfigSchema = z.object({
  accessPublicKey: z.string().min(1),
  accessPrivateKey: z.string().min(1),
  refreshPublicKey: z.string().min(1),
  refreshPrivateKey: z.string().min(1),
});

export const authConfig = registerAs('auth', () => {
  try {
    return authConfigSchema.parse({
      accessPublicKey: fs.readFileSync(
        process.env.AUTH_ACCESS_PUBLIC_KEY_PATH as string,
        'utf8',
      ),
      accessPrivateKey: fs.readFileSync(
        process.env.AUTH_ACCESS_PRIVATE_KEY_PATH as string,
        'utf8',
      ),
      refreshPublicKey: fs.readFileSync(
        process.env.AUTH_REFRESH_PUBLIC_KEY_PATH as string,
        'utf8',
      ),
      refreshPrivateKey: fs.readFileSync(
        process.env.AUTH_REFRESH_PRIVATE_KEY_PATH as string,
        'utf8',
      ),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Auth Config Error (Keys not found or invalid): ${error.message}`,
        { cause: error },
      );
    }
    throw error;
  }
});
