import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { USER_COLLECTION_NAME, UserDocument } from './models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import Redis from 'ioredis';
import { User } from './interfaces/user.interface';
import { redisUsersKey } from 'src/redis/redis.keys';

@Injectable()
export class UsersRepository {
  protected readonly logger: Logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(USER_COLLECTION_NAME)
    private readonly userModel: Model<UserDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(document: Omit<UserDocument, '_id'>): Promise<User> {
    const createdUser = new this.userModel({
      ...document,
      _id: new Types.ObjectId(),
    });
    const savedUser = await createdUser.save();

    await this.redis.hset(
      redisUsersKey(savedUser.username),
      this.serializeToRedis(savedUser),
    );

    return this.deserialize(savedUser);
  }

  async findOneByUsername(username: string): Promise<User> {
    // check if username exists in redis store
    const redisUser = await this.redis.hgetall(redisUsersKey(username));

    if (Object.keys(redisUser).length === 0) {
      this.logger.log(`user: ${username} does not exist in redis`);
      // User does not exist in redis store
      const user = await this.userModel.findOne({ username });
      if (!user) {
        this.logger.warn(`User not found with username: ${username}`);
        throw new NotFoundException('User not found');
      }
      return this.deserialize(user);
    } else {
      this.logger.log(`user: ${username} exists in redis`);
      // User exits in redis store
      return this.deserializeFromRedis(username, redisUser);
    }
  }

  private deserialize(user: UserDocument): User {
    return {
      id: user._id.toHexString(),
      createdAt: user.createdAt,
      username: user.username,
      password: user.password,
    };
  }

  private serializeToRedis(user: UserDocument) {
    return {
      id: user._id,
      createdAt: user.createdAt.getTime(),
      password: user.password,
    };
  }

  private deserializeFromRedis(
    username: string,
    user: Record<string, string>,
  ): User {
    return {
      id: user.id,
      username: username,
      createdAt: new Date(parseInt(user.createdAt)),
      password: user.password,
    };
  }
}
