import * as Joi from 'joi';
import { ConfigFactory, registerAs } from '@nestjs/config';
import * as fs from 'fs';

export interface IAuthConfig {
  accessPublicKey: string;
  accessPrivateKey: string;
  refreshPublicKey: string;
  refreshPrivateKey: string;
}

export const AUTH_CONFIG_TOKEN = 'auth-config-token';

const authConfigSchema = Joi.object<IAuthConfig>({
  accessPublicKey: Joi.string().required(),
  accessPrivateKey: Joi.string().required(),
  refreshPublicKey: Joi.string().required(),
  refreshPrivateKey: Joi.string().required(),
});

export const authConfig = registerAs<IAuthConfig, ConfigFactory<IAuthConfig>>(
  AUTH_CONFIG_TOKEN,
  () => {
    const { error, value } = authConfigSchema.validate(
      {
        accessPublicKey: fs.readFileSync(
          process.env.AUTH_ACCESS_PUBLIC_KEY_PATH,
        ),
        accessPrivateKey: fs.readFileSync(
          process.env.AUTH_ACCESS_PRIVATE_KEY_PATH,
        ),
        refreshPublicKey: fs.readFileSync(
          process.env.AUTH_REFRESH_PUBLIC_KEY_PATH,
        ),
        refreshPrivateKey: fs.readFileSync(
          process.env.AUTH_REFRESH_PRIVATE_KEY_PATH,
        ),
      },
      {
        allowUnknown: false,
        abortEarly: false,
      },
    );

    if (error) throw error;

    return value;
  },
);
