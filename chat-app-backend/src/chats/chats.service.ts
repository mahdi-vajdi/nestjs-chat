import { ConflictException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsRepository } from './chats.repository';
import { UserDocument } from 'src/users/models/user.schema';
import { UsersService } from 'src/users/users.service';
import { ResponseChat } from './interfaces/response-chat.interface';
import { ChatDocument } from './models/chat.schema';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createChatDto: CreateChatDto,
    currentUser: UserDocument,
  ): Promise<ResponseChat> {
    const receiver = await this.usersService.findOne(createChatDto.receiver);

    // check if the chat has not been created yet
    const chatExists = await this.chatsRepository.findOneChat(
      currentUser._id,
      receiver._id,
    );
    if (chatExists) throw new ConflictException('Chat already exists');

    const createdChat = await this.chatsRepository.createChat({
      createdAt: new Date(),
      user1: currentUser,
      user2: receiver,
    });

    return this.deserialize(createdChat, receiver.username);
  }

  async findAllChats(user: UserDocument): Promise<ResponseChat[]> {
    const chats = await this.chatsRepository.findAllChats(user._id);

    return chats.map((chat) => {
      const receiver =
        user.username === chat.user1.username
          ? chat.user2.username
          : chat.user1.username;

      return this.deserialize(chat, receiver);
    });
  }

  async findChatById(chatId: string) {
    return await this.chatsRepository.findChatById(chatId);
  }

  private deserialize(
    chat: ChatDocument,
    receiverUsername: string,
  ): ResponseChat {
    return {
      chatId: chat._id.toHexString(),
      createdAt: chat.createdAt,
      receiver: receiverUsername,
    };
  }
}
