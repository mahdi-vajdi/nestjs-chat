import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MESSAGE_COLLECTION_NAME,
  MessageDocument,
} from './models/message.schema';
import { IORedisKey } from 'src/redis/redis.module';
import Redis from 'ioredis';
import {
  redisSocketChatUserKey,
  redisUserSocketIdKey,
} from 'src/redis/redis.keys';

@Injectable()
export class MessagesRepository {
  protected readonly logger: Logger = new Logger(MessagesRepository.name);

  constructor(
    @InjectModel(MESSAGE_COLLECTION_NAME)
    private readonly messageModel: Model<MessageDocument>,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {}

  async onSocketConnected(chatId: string, username: string, clientId: string) {
    const res = await this.redisClient.set(
      redisSocketChatUserKey(chatId, username),
      clientId,
    );
    console.log('saved to redis: ', res);
  }

  async onSocketDisconnected(username: string) {
    await this.redisClient.del(redisUserSocketIdKey(username));
  }

  async getSocket(chatId: string, username: string) {
    return this.redisClient.get(redisSocketChatUserKey(chatId, username));
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
