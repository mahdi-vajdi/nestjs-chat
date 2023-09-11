import { InjectModel } from '@nestjs/mongoose';
import {
  CHAT_COLLECTION_NAME,
  ChatDocument,
  PopulatedChatDocument,
} from './models/chat.schema';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UserDocument } from 'src/users/models/user.schema';
import { redisChatKey } from 'src/redis/redis.keys';
import { Chat } from './interfaces/chat.interface';

export class ChatsRepository {
  private readonly logger = new Logger(ChatsRepository.name);

  constructor(
    @InjectModel(CHAT_COLLECTION_NAME)
    private readonly chatModel: Model<ChatDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async createChat(chat: Omit<ChatDocument, '_id'>) {
    const createdChat = new this.chatModel({
      ...chat,
      _id: new Types.ObjectId(),
    });

    const savedChat = await createdChat.save().then((doc) =>
      doc.populate<{
        user1: UserDocument;
        user2: UserDocument;
      }>(['user1', 'user2']),
    );

    await this.redis.hset(
      redisChatKey(savedChat._id.toHexString()),
      this.serializeToRedis(savedChat),
    );

    return this.deserialize(savedChat);
  }

  async findAllChats(userId: string) {
    const chats = await this.chatModel
      .find({ $or: [{ user1: userId }, { user2: userId }] })
      .populate<{ user1: UserDocument; user2: UserDocument }>([
        'user1',
        'user2',
      ])
      .exec();
    return chats;
  }

  async chatExists(user1: string, user2: string) {
    return this.chatModel
      .exists({
        $or: [
          { user1, user2 },
          { user1: user2, user2: user1 },
        ],
      })
      .exec();
  }

  async findChatById(chatId: string) {
    // check if chat exists in redis store
    const redisChat = await this.redis.hgetall(redisChatKey(chatId));

    if (Object.keys(redisChat).length === 0) {
      this.logger.log(`chat: ${chatId} does not exist in redis`);

      const chat = await this.chatModel
        .findById(chatId)
        .populate<{
          user1: UserDocument;
          user2: UserDocument;
        }>(['user1', 'user2'])
        .exec();

      if (!chat)
        throw new NotFoundException(
          `Could not find any chat with id: ${chatId}`,
        );
      return this.deserialize(chat);
    } else {
      this.logger.log(`chat: ${chatId} exists in redis`);
      return this.deserializeFromRedis(chatId, redisChat);
    }
  }

  private deserialize(chat: PopulatedChatDocument): Chat {
    return {
      id: chat._id.toHexString(),
      createdAt: chat.createdAt,
      user1: chat.user1.username,
      user2: chat.user2.username,
    };
  }

  private serializeToRedis(chat: PopulatedChatDocument) {
    return {
      createdAt: chat.createdAt.getTime(),
      user1: chat.user1.username,
      user2: chat.user2.username,
    };
  }

  private deserializeFromRedis(
    chatId: string,
    chat: Record<string, string>,
  ): Chat {
    return {
      id: chatId,
      createdAt: new Date(parseInt(chat.createdAt)),
      user1: chat.user1,
      user2: chat.user2,
    };
  }
}
