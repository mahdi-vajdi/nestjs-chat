import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ChatsRepository } from './chats.repository';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CHAT_COLLECTION_NAME, ChatSchema } from './models/chat.schema';
import { redisModule } from 'src/redis/redis.config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: CHAT_COLLECTION_NAME, schema: ChatSchema },
    ]),
    redisModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository],
  exports: [ChatsService],
})
export class ChatsModule {}
