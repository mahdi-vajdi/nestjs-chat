import { InjectModel } from '@nestjs/mongoose';
import { CHAT_COLLECTION_NAME, ChatDocument } from './models/chat.schema';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { Inject } from '@nestjs/common';
import { UserDocument } from 'src/users/models/user.schema';

export class ChatsRepository {
  constructor(
    @InjectModel(CHAT_COLLECTION_NAME)
    private readonly chatModel: Model<ChatDocument>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async createChat(chat: Omit<ChatDocument, '_id'>) {
    const createdDocument = new this.chatModel({
      ...chat,
      _id: new Types.ObjectId(),
    });

    return createdDocument.save().then((doc) =>
      doc.populate<{
        user1: UserDocument;
        user2: UserDocument;
      }>(['user1', 'user2']),
    );
  }

  async findAllChats(userId: string) {
    const chats = await this.chatModel
      .find({ $or: [{ user1: userId }, { user2: userId }] })
      .populate<{ user1: UserDocument; user2: UserDocument }>([
        'user1',
        'user2',
      ]);
    return chats;
  }

  async findOneChat(user1: string, user2: string) {
    return this.chatModel.findOne({
      $or: [
        { user1, user2 },
        { user1: user2, user2: user1 },
      ],
    });
  }

  async findChatById(chatId: string) {
    return this.chatModel
      .findById(chatId)
      .populate<{ user1: UserDocument; user2: UserDocument }>([
        'user1',
        'user2',
      ])
      .exec();
  }

  // private async deserializeChat(chat: ChatDocument)
}
