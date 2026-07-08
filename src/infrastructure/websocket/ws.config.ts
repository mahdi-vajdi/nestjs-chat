import * as Joi from 'joi';
import { ConfigFactory, registerAs } from '@nestjs/config';

export interface WsConfig {
  port: number;
}

export const WS_CONFIG_TOKEN = 'ws-config-token';

const wsConfigSchema = Joi.object({
  port: Joi.number().port().required(),
});

export const wsConfig = registerAs<WsConfig, ConfigFactory<WsConfig>>(
  WS_CONFIG_TOKEN,
  () => {
    const { error, value } = wsConfigSchema.validate(
      {
        port: process.env.WEBSOCKET_PORT,
      },
      {
        allowUnknown: false,
        abortEarly: false,
      },
    );

    if (error) throw new Error(`Error validating WS config: ${error.message}`);

    return value;
  },
);
