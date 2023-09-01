import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesRepository } from './messages.repository';
import { UsersService } from 'src/users/users.service';
import { Types } from 'mongoose';
import { MessageDocument } from './models/message.schema';
import { ResponseMessage } from './interfaces/response-message.interface';
import { ChatsService } from 'src/chats/chats.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly usersService: UsersService,
    private readonly chatService: ChatsService,
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

  async createMessage(
    { text, receiver, chatId }: CreateMessageDto,
    currentUsername: string,
  ): Promise<ResponseMessage> {
    const chat = await this.chatService.findChatById(chatId);
    const senderUser = await this.usersService.findOne(currentUsername);
    const receiverUser = await this.usersService.findOne(receiver);

    const message = await this.messagesRepository.createMessage({
      timestamp: new Date(),
      chat,
      text,
      sender: senderUser,
      receiver: receiverUser,
    });

    return this.deserialize(message);
  }

  async findChatAllMessages(chatId: Types.ObjectId) {
    const messages = await this.messagesRepository.findAllChatMessages(chatId);
    return messages.map((message) => this.deserialize(message));
  }

  async findAllUserMessages(userId: string) {
    const messages = await this.messagesRepository.findAllUserMessages(userId);
  }

  private deserialize(message: MessageDocument): ResponseMessage {
    return {
      messageId: message._id.toHexString(),
      timestamp: message.timestamp,
      chatId: message.chat._id.toHexString(),
      sender: message.sender.username,
      receiver: message.receiver.username,
    };
  }
}
