import { InjectModel } from '@nestjs/mongoose';
import { ChatDocument } from './models/chat.schema';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import { Inject } from '@nestjs/common';

export class ChatsRepository {
  constructor(
    @InjectModel(ChatDocument.name)
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

  async findAllChats(userId: string) {
    return this.chatModel.find({ $or: [{ user1: userId }, { user2: userId }] });
  }
}
