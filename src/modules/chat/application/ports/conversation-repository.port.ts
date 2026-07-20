import { Result } from '@common/result/result';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { MessageEntity } from '@chat/domain/models/message.entity';

export abstract class ConversationRepositoryPort {
  abstract getConversationById(
    id: string,
  ): Promise<Result<ConversationEntity | null>>;
  abstract saveConversation(
    conversation: ConversationEntity,
  ): Promise<Result<ConversationEntity>>;
  abstract saveMessage(message: MessageEntity): Promise<Result<MessageEntity>>;
  abstract deleteConversation(id: string): Promise<Result<boolean>>;
}
