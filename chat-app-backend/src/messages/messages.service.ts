import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesRepository } from './messages.repository';
import { UserDocument } from 'src/users/models/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly usersService: UsersService,
  ) {}

  async onSocketConnected(username: string, clientId: string) {
    this.messagesRepository.onSocketConnected(username, clientId);
  }

  async onSocketDisconnected(username: string) {
    this.messagesRepository.onSocketDisconnected(username);
  }

  async getSocket(username: string) {
    return this.messagesRepository.getSocket(username);
  }

  async create({ text, receiver }: CreateMessageDto, username: string) {
    const sender = await this.usersService.findOne(username);
    const receiverId = (await this.usersService.findOne(receiver))._id;
    return await this.messagesRepository.createMessage({
      timestamp: new Date(),
      text,
      sender: sender._id.toHexString(),
      receiver: receiverId.toHexString(),
    });
  }

  async findAllReceived(userId: string) {
    return this.messagesRepository.find({ receiver: userId });
  }

  findAllReceivedFromSender(userId: string, senderId: string) {
    const messages = this.messagesRepository.find({
      receiver: userId,
      sender: senderId,
    });
  }

  // identify(name: string, clientId: string) {
  //   this.clientToUser[clientId] = name;
  //   return Object.values(this.clientToUser);
  // }

  // getClientName(clientId: string) {
  //   return this.clientToUser[clientId];
  // }
}
