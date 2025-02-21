import * as Joi from 'joi';
import { ConfigFactory, registerAs } from '@nestjs/config';

export interface IRedisConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export const REDIS_CONFIG_TOKEN = 'redis-configs-token';

const redisConfigSchema = Joi.object<IRedisConfig>({
  host: Joi.string().hostname().required(),
  port: Joi.number().port().required(),
  username: Joi.string().allow('').required(),
  password: Joi.string().allow('').required(),
});

export const redisConfig = registerAs<
  IRedisConfig,
  ConfigFactory<IRedisConfig>
>(REDIS_CONFIG_TOKEN, () => {
  const { error, value } = redisConfigSchema.validate(
    {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    },
    {
      allowUnknown: false,
      abortEarly: false,
    },
  );

  if (error) throw new Error(`Error validating redis config: ${error.message}`);

  return value;
});
