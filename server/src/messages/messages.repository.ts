import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MESSAGE_COLLECTION_NAME,
  MessageDocument,
  PopulatedMessageDocument,
} from './models/message.schema';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import Redis from 'ioredis';
import { redisSocketChatUserKey } from 'src/redis/redis.keys';
import { UserDocument } from 'src/users/models/user.schema';
import { Message } from './interfaces/message.interface';

@Injectable()
export class MessagesRepository {
  protected readonly logger: Logger = new Logger(MessagesRepository.name);

  constructor(
    @InjectModel(MESSAGE_COLLECTION_NAME)
    private readonly messageModel: Model<MessageDocument>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async onSocketConnected(chatId: string, username: string, clientId: string) {
    this.redisClient.set(redisSocketChatUserKey(chatId, username), clientId);
  }

  async onSocketDisconnected(chatId: string, username: string) {
    await this.redisClient.del(redisSocketChatUserKey(chatId, username));
  }

  async getSocket(chatId: string, username: string) {
    return this.redisClient.get(redisSocketChatUserKey(chatId, username));
  }

  async createMessage(message: Omit<MessageDocument, '_id'>) {
    const createdMessage = new this.messageModel({
      _id: new Types.ObjectId(),
      ...message,
    });
    const savedMessage = await createdMessage.save().then((doc) =>
      doc.populate<{
        sender: UserDocument;
        receiver: UserDocument;
      }>(['sender', 'receiver']),
    );

    return this.deserialize(savedMessage);
  }

  async findAllChatMessages(chatId: string) {
    const messages = await this.messageModel
      .find({ chat: chatId })
      .populate<{
        sender: UserDocument;
        receiver: UserDocument;
      }>(['sender', 'receiver'])
      .exec();

    return messages.map((message) => this.deserialize(message));
  }

  async messageSeen(messageId: string) {
    await this.messageModel.findByIdAndUpdate(messageId, { seen: true }).exec();
  }

  private deserialize(message: PopulatedMessageDocument): Message {
    return {
      messageId: message._id.toHexString(),
      timestamp: message.timestamp,
      chatId: message.chat._id.toHexString(),
      sender: message.sender.username,
      receiver: message.receiver.username,
      text: message.text,
      seen: message.seen,
    };
  }
}
