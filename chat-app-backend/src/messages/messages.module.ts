import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MESSAGE_COLLECTION_NAME,
  MessageSchema,
} from './models/message.schema';
import { MessagesRepository } from './messages.repository';
import { UsersModule } from 'src/users/users.module';
import { redisModule } from 'src/redis/redis.config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      {
        name: MESSAGE_COLLECTION_NAME,
        schema: MessageSchema,
      },
    ]),
    redisModule,
  ],
  providers: [MessagesGateway, MessagesService, MessagesRepository],
})
export class MessagesModule {}
