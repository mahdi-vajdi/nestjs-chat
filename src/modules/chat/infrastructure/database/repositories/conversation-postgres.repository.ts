import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@modules/chat/infrastructure/database/entities/message.entity';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { Conversation } from '@modules/chat/infrastructure/database/entities/conversation.entity';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';
import { ConversationMember } from '@modules/chat/infrastructure/database/entities/conversation-member.entity';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { DeletedMessage } from '@modules/chat/infrastructure/database/entities/deleted-message.entity';

@Injectable()
export class ConversationPostgresRepository implements ConversationRepositoryPort {
  constructor(
    @InjectDataSource(DatabaseType.POSTGRES)
    private readonly dataSource: DataSource,
  ) {}

  async getConversationById(id: string): Promise<ConversationEntity | null> {
    const conversation = await this.dataSource
      .getRepository(Conversation)
      .findOne({
        where: { id },
        relations: { conversationMembers: true },
      });

    if (!conversation) {
      return null;
    }

    return Conversation.toDomain(conversation);
  }

  async saveConversation(
    conversationEntity: ConversationEntity,
  ): Promise<ConversationEntity> {
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

    return Conversation.toDomain(res);
  }

  async saveMessage(messageEntity: MessageEntity): Promise<MessageEntity> {
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

    return entity;
  }

  async deleteConversation(id: string): Promise<boolean> {
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

    return res;
  }
}
