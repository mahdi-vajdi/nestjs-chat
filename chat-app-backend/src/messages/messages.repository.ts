import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MESSAGE_COLLECTION_NAME,
  MessageDocument,
} from './models/message.schema';
import { IORedisKey } from 'src/redis/redis.module';
import Redis from 'ioredis';
import { redisUserSocketId } from 'src/redis/redis.keys';

@Injectable()
export class MessagesRepository {
  protected readonly logger: Logger = new Logger(MessagesRepository.name);

  constructor(
    @InjectModel(MESSAGE_COLLECTION_NAME)
    private readonly messageModel: Model<MessageDocument>,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {}

  async onSocketConnected(username: string, socketId: string) {
    await this.redisClient.set(redisUserSocketId(username), socketId);
  }

  async onSocketDisconnected(username: string) {
    await this.redisClient.del(redisUserSocketId(username));
  }

  async getSocket(username: string) {
    return this.redisClient.get(redisUserSocketId(username));
  }

  async createMessage(message: Omit<MessageDocument, '_id'>) {
    const createdDocument = new this.messageModel({
      ...message,
      _id: new Types.ObjectId(),
    });
    return (
      await createdDocument.save()
    ).toJSON() as unknown as MessageDocument;
  }

  async findAllChatMessages(chatId: Types.ObjectId) {
    return this.messageModel.find({ chat: chatId }, {}, { lean: true });
  }

  async findAllUserMessages(userId: string) {
    return this.messageModel.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });
  }
}
