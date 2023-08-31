import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesRepository } from './messages.repository';
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

  async create({ text, receiver, chatId }: CreateMessageDto, username: string) {
    const sender = await this.usersService.findOne(username);
    const receiverDoc = await this.usersService.findOne(receiver);
    return await this.messagesRepository.createMessage({
      timestamp: new Date(),
      chat: chatId,
      text,
      sender: sender,
      receiver: receiverDoc,
    });
  }

  async getAllMessagesForChat(chatId: string) {
    const messages = await this.messagesRepository.getAllMessagesForChat(
      chatId,
    );
    console.log(messages);
  }

  // identify(name: string, clientId: string) {
  //   this.clientToUser[clientId] = name;
  //   return Object.values(this.clientToUser);
  // }

  // getClientName(clientId: string) {
  //   return this.clientToUser[clientId];
  // }
}
