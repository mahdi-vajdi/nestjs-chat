import * as Joi from 'joi';
import { ConfigFactory, registerAs } from '@nestjs/config';

export interface IWebsocketConfig {
  port: number;
}

export const WEBSOCKET_CONFIG_TOKEN = 'websocket-configs-token';

const websocketConfigSchema = Joi.object({
  port: Joi.number().port().required(),
});

export const websocketConfig = registerAs<
  IWebsocketConfig,
  ConfigFactory<IWebsocketConfig>
>(WEBSOCKET_CONFIG_TOKEN, () => {
  const { error, value } = websocketConfigSchema.validate(
    {
      port: process.env.WEBSOCKET_PORT,
    },
    {
      allowUnknown: false,
      abortEarly: false,
    },
  );

  if (error)
    throw new Error(`Error validating websocket config: ${error.message}`);

  return value;
});
