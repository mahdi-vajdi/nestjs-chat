import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { MessageEntity } from '@chat/domain/models/message.entity';

export abstract class ConversationRepositoryPort {
  abstract getConversationById(id: string): Promise<ConversationEntity | null>;
  abstract saveConversation(
    conversation: ConversationEntity,
  ): Promise<ConversationEntity>;
  abstract saveMessage(message: MessageEntity): Promise<MessageEntity>;
  abstract deleteConversation(id: string): Promise<boolean>;
}
