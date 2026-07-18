import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@chat/infrastructure/postgres/entities/message.entity';
import { ChatCommandRepositoryPort } from '@chat/application/ports/chat-repository.port';
import { Conversation } from '@chat/infrastructure/postgres/entities/conversation.entity';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ConversationMember } from '@chat/infrastructure/postgres/entities/conversation-member.entity';
import { MessageEntity } from '@chat/domain/models/message.entity';
import { DeletedMessage } from '@chat/infrastructure/postgres/entities/deleted-message.entity';

@Injectable()
export class ChatCommandPostgresRepository implements ChatCommandRepositoryPort {
  constructor(
    @InjectDataSource(DatabaseType.POSTGRES)
    private readonly dataSource: DataSource,
  ) {}

  @TryCatch
  async saveConversation(
    conversationEntity: ConversationEntity,
  ): Promise<Result<ConversationEntity>> {
    const res = await this.dataSource.transaction(async (entityManager) => {
      // Save Conversation
      const conversationToSave = Conversation.fromDomain(conversationEntity);
      const conversation = await entityManager.save(conversationToSave);

      // Save Conversation Members
      if (conversationToSave.conversationMembers?.length) {
        await entityManager.save(conversationToSave.conversationMembers);
      }

      // Save Messages
      if (conversationToSave.messages?.length) {
        await entityManager.save(conversationToSave.messages);
      }

      return conversation;
    });

    return Result.ok(Conversation.toDomain(res));
  }

  @TryCatch
  async saveMessage(
    messageEntity: MessageEntity,
  ): Promise<Result<MessageEntity>> {
    const res = await this.dataSource.transaction(async (entityManager) => {
      const messageToSave = Message.fromDomain(messageEntity);
      const message = await entityManager.save(messageToSave);

      // Save deleted message relations
      if (messageEntity.deletedForUserIds?.length) {
        const deletedMessages = messageEntity.deletedForUserIds.map(
          (userId) => {
            const dm = new DeletedMessage();
            dm.user_id = userId;
            dm.message_id = message.id;
            return dm;
          },
        );
        await entityManager.save(DeletedMessage, deletedMessages);
      }

      // Update the last_message_id for all conversation members who have NOT deleted this message
      const conversationMembersToUpdate = await entityManager
        .getRepository(ConversationMember)
        .createQueryBuilder('cm')
        .where('cm.conversation_id = :conversationId', {
          conversationId: message.conversation_id,
        })
        .getMany();

      const memberUpdates = conversationMembersToUpdate.map((cm) => {
        // If the user hasn't deleted the message, update their last message
        if (!messageEntity.deletedForUserIds.includes(cm.user_id)) {
          cm.last_message_id = message.id;
        }
        // If the user is the sender, also update their last_seen_message
        if (cm.user_id === messageEntity.senderId) {
          cm.last_seen_message_id = message.id;
        }
        return cm;
      });

      await entityManager.save(ConversationMember, memberUpdates);

      return message;
    });

    const entity = Message.toDomain(res);
    // Restore the deletedForUserIds to the returned entity since we don't map it back natively in fromDomain
    messageEntity.deletedForUserIds.forEach((id) => entity.deleteForUser(id));

    return Result.ok(entity);
  }

  @TryCatch
  async deleteConversation(id: string): Promise<Result<boolean>> {
    const res = await this.dataSource.transaction(async (entityManager) => {
      const [, deleteConversation] = await Promise.all([
        entityManager
          .createQueryBuilder()
          .softDelete()
          .from(ConversationMember)
          .where('conversation_id = :conversationId', { conversationId: id })
          .execute(),
        entityManager
          .createQueryBuilder()
          .softDelete()
          .from(Conversation)
          .where('id = :id', { id: id })
          .execute(),
      ]);

      return deleteConversation.affected === 1;
    });

    return Result.ok(res);
  }
}
