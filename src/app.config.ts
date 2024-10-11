import * as Joi from 'joi';
import { ConfigFactory, registerAs } from '@nestjs/config';

export interface IAppConfig {
  debugMode: boolean;
}

export const APP_CONFIG_TOKEN = 'app-config-token';

const appConfigSchema = Joi.object<IAppConfig>({
  debugMode: Joi.boolean().default(false),
});

export const appConfig = registerAs<IAppConfig, ConfigFactory<IAppConfig>>(
  APP_CONFIG_TOKEN,
  () => {
    const { error, value } = appConfigSchema.validate(
      {
        debugMode: process.env.DEBUG_MODE,
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
