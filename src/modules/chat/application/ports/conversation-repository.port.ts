import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';

export abstract class ConversationRepositoryPort {
  abstract getConversationById(id: string): Promise<ConversationEntity | null>;
  abstract saveConversation(
    conversation: ConversationEntity,
  ): Promise<ConversationEntity>;
  abstract getMessageById(id: string): Promise<MessageEntity | null>;
  abstract saveMessage(message: MessageEntity): Promise<MessageEntity>;
  abstract updateMessage(message: MessageEntity): Promise<MessageEntity>;
  abstract deleteConversation(id: string): Promise<boolean>;
}
