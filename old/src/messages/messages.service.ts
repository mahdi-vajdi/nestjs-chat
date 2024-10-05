import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { UsersService } from 'src/users/users.service';
import { ChatsService } from 'src/chats/chats.service';
import { Types } from 'mongoose';
import { Chat } from 'src/chats/interfaces/chat.interface';
import { Message } from './interfaces/message.interface';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly usersService: UsersService,
    private readonly chatService: ChatsService,
  ) {}

  async onSocketConnected(chatId: string, username: string, clientId: string) {
    this.messagesRepository.onSocketConnected(chatId, username, clientId);
  }

  async onSocketDisconnected(chatId: string, username: string) {
    this.messagesRepository.onSocketDisconnected(chatId, username);
  }

  async getSocket(chatId: string, username: string) {
    return this.messagesRepository.getSocket(chatId, username);
  }

  async createMessage(
    text: string,
    chatId: string,
    senderUsername: string,
  ): Promise<Message> {
    const chat: Chat = await this.chatService.findChatById(chatId);
    const sender = await this.usersService.findOneByUsername(senderUsername);

    // Get the receiver
    const receiverUsername =
      sender.username === chat.user1 ? chat.user2 : chat.user1;

    const receiverUser = await this.usersService.findOneByUsername(
      receiverUsername,
    );

    return this.messagesRepository.createMessage({
      timestamp: new Date(),
      chat: new Types.ObjectId(chat.id),
      text,
      sender: new Types.ObjectId(sender.id),
      receiver: new Types.ObjectId(receiverUser.id),
      seen: false,
    });
  }

  async findAllChatMessages(chatId: string): Promise<Message[]> {
    return this.messagesRepository.findAllChatMessages(chatId);
  }

  async messageSeen(messageId: string) {
    this.messagesRepository.messageSeen(messageId);
  }
}
