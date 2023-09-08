import { ConflictException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsRepository } from './chats.repository';
import { UsersService } from 'src/users/users.service';
import { ResponseChat } from './interfaces/response-chat.interface';
import { User } from 'src/users/interfaces/user.interface';
import { Types } from 'mongoose';
import { Chat } from './interfaces/chat.interface';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createChatDto: CreateChatDto,
    currentUser: User,
  ): Promise<ResponseChat> {
    const receiver = await this.usersService.findOneByUsername(
      createChatDto.receiver,
    );

    // check if the chat has not been created yet
    const chatExists = await this.chatsRepository.chatExists(
      currentUser.id,
      receiver.id,
    );
    if (chatExists) throw new ConflictException('Chat already exists');

    const createdChat = await this.chatsRepository.createChat({
      createdAt: new Date(),
      user1: new Types.ObjectId(currentUser.id),
      user2: new Types.ObjectId(receiver.id),
    });

    return {
      chatId: createdChat.id,
      createdAt: createdChat.createdAt,
      receiver: createdChat.user2,
    };
  }

  async findAllChats(user: User): Promise<ResponseChat[]> {
    const chats = await this.chatsRepository.findAllChats(user.id);

    return chats.map((chat) => {
      const receiver =
        user.username === chat.user1.username
          ? chat.user2.username
          : chat.user1.username;

      return {
        chatId: chat._id.toHexString(),
        createdAt: chat.createdAt,
        receiver: receiver,
      };
    });
  }

  async findChatById(chatId: string): Promise<Chat> {
    return this.chatsRepository.findChatById(chatId);
  }
}
