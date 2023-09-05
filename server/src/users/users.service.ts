import {
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from './models/user.schema';
import { UserModel } from './interfaces/user.interface';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { Redis } from 'ioredis';
import { redisUsersKey } from 'src/redis/redis.keys';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserDto(createUserDto);
    const user = await this.usersRepository.create({
      ...createUserDto,
      createdAt: new Date(),
      password: await bcrypt.hash(createUserDto.password, 10),
    });

    await this.redis.hset(
      redisUsersKey(user.username),
      this.serializeToRedis(user),
    );

    return this.deserialize(user);
  }

  async findOne(username: string) {
    return this.usersRepository.findOne(username);
  }

  async findOneByUsername(username: string) {
    const user = await this.redis.hgetall(redisUsersKey(username));
    console.log('user', user);

    // if (Object.keys(user).length === 0)
    //   return await this.usersRepository.findOne(username);
    return this.deserializeFromRedis(username, user);
  }

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    try {
      await this.usersRepository.findOne(createUserDto.username);
    } catch (error) {
      return;
    }
    throw new UnprocessableEntityException('Username Already Exists.');
  }

  async verifyUser(username: string, password: string): Promise<UserModel> {
    const user = await this.usersRepository.findOne(username);
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      throw new UnauthorizedException('Credintials are not valid');
    return this.deserialize(user);
  }

  private deserialize(user: UserDocument): UserModel {
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
  ): UserModel {
    return {
      id: user._id,
      username: username,
      createdAt: new Date(user.createdAt),
      password: user.password,
    };
  }
}
