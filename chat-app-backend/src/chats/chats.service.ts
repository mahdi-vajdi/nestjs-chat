import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsRepository } from './chats.repository';
import { UserDocument } from 'src/users/models/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(createChatDto: CreateChatDto, currentUser: UserDocument) {
    const receiver = await this.usersService.findOne(createChatDto.receiver);

    return this.chatsRepository.createChat({
      createdAt: new Date(),
      user1: currentUser._id.toHexString(),
      user2: receiver._id.toHexString(),
    });
  }

  async findAllChats(user: UserDocument) {
    return this.chatsRepository.findAllChats(user._id.toHexString());
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }
}
