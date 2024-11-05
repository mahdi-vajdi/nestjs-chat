import * as Joi from 'joi';
import { ConfigFactory, registerAs } from '@nestjs/config';

export interface IHttpConfig {
  port: number;
}

export const HTTP_CONFIG_TOKEN = 'http-config-token';

const httpConfigSchema = Joi.object<IHttpConfig>({
  port: Joi.number().port().required(),
});

export const httpConfig = registerAs<IHttpConfig, ConfigFactory<IHttpConfig>>(
  HTTP_CONFIG_TOKEN,
  () => {
    const { error, value } = httpConfigSchema.validate(
      {
        port: process.env.PORT,
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
