import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_COLLECTION_NAME, UserSchema } from './models/user.schema';
import { UsersRepository } from './users.repository';
import { redisModule } from 'src/redis/redis.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: USER_COLLECTION_NAME, schema: UserSchema },
    ]),
    redisModule,
  ],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
