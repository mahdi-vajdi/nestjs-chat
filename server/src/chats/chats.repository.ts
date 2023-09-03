import { InjectModel } from '@nestjs/mongoose';
import { CHAT_COLLECTION_NAME, ChatDocument } from './models/chat.schema';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import { Inject } from '@nestjs/common';

export class ChatsRepository {
  constructor(
    @InjectModel(CHAT_COLLECTION_NAME)
    private readonly chatModel: Model<ChatDocument>,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {}

  async createChat(chat: Omit<ChatDocument, '_id'>) {
    const createdDocument = new this.chatModel({
      ...chat,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save()).toJSON() as unknown as ChatDocument;
  }

  async findAllChats(userId: Types.ObjectId) {
    return this.chatModel
      .find({ $or: [{ user1: userId }, { user2: userId }] })
      .populate(['user1', 'user2'])
      .exec();
  }

  async findOneChat(user1: Types.ObjectId, user2: Types.ObjectId) {
    return this.chatModel.findOne({
      $or: [
        { user1, user2 },
        { user1: user2, user2: user1 },
      ],
    });
  }

  async findChatById(chatId: string) {
    return this.chatModel.findById(chatId).populate(['user1', 'user2']).exec();
  }
}
