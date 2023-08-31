import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ChatsRepository } from './chats.repository';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatDocument, ChatSchema } from './models/chat.schema';
import { redisModule } from 'src/redis/redis.config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: ChatDocument.name, schema: ChatSchema },
    ]),
    redisModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository],
})
export class ChatsModule {}
