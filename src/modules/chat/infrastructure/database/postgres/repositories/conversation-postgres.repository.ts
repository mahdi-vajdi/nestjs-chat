import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@modules/chat/infrastructure/database/postgres/entities/message.entity';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { Conversation } from '@modules/chat/infrastructure/database/postgres/entities/conversation.entity';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';
import { ConversationMember } from '@modules/chat/infrastructure/database/postgres/entities/conversation-member.entity';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { DeletedMessage } from '@modules/chat/infrastructure/database/postgres/entities/deleted-message.entity';

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

      // Reload with relation
      return entityManager.findOne(Conversation, {
        where: { id: conversation.id },
        relations: { conversationMembers: true },
      });
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
        if (cm.id === messageEntity.senderId) {
          cm.last_seen_message_id = message.id;
        }
        return cm;
      });

      await entityManager.save(ConversationMember, memberUpdates);

      return message;
    });

    const entity = Message.toDomain(res);
    // Restore the deletedForUserIds to the returned entity since we don't map it back natively in fromDomain
    messageEntity.deletedForUserIds.forEach((id) =>
      entity.loadDeletedForUserId(id),
    );

    return entity;
  }

  async getMessageById(id: string): Promise<MessageEntity | null> {
    const message = await this.dataSource.getRepository(Message).findOne({
      where: { id },
      relations: { sender: true, conversation: true },
    });

    if (!message) {
      return null;
    }

    const deletedMessages = await this.dataSource
      .getRepository(DeletedMessage)
      .find({
        where: { message_id: id },
      });

    const entity = Message.toDomain(message);
    deletedMessages.forEach((dm) => entity.loadDeletedForUserId(dm.user_id));

    return entity;
  }

  async updateMessage(messageEntity: MessageEntity): Promise<MessageEntity> {
    await this.dataSource.getRepository(Message).update(messageEntity.id, {
      text: messageEntity.text,
      edited_at: messageEntity.editedAt ?? null,
      updated_at: messageEntity.updatedAt,
    });

    const updated = await this.getMessageById(messageEntity.id);
    return updated!;
  }

  async saveMessageDeletion(
    messageEntity: MessageEntity,
  ): Promise<MessageEntity> {
    await this.dataSource.transaction(async (entityManager) => {
      // 1. Save deleted message relations for users who deleted this message
      if (messageEntity.deletedForUserIds?.length) {
        await entityManager
          .createQueryBuilder()
          .insert()
          .into(DeletedMessage)
          .values(
            messageEntity.deletedForUserIds.map((userId) => ({
              user_id: userId,
              message_id: messageEntity.id,
            })),
          )
          .orIgnore()
          .execute();
      }

      // 2. Update message deleted_at and updated_at (text retained)
      await entityManager.getRepository(Message).update(messageEntity.id, {
        deleted_at: messageEntity.deletedAt ?? null,
        updated_at: messageEntity.updatedAt,
      });

      // 3. Recompute last_message_id for any conversation member whose last_message_id was this message
      const membersWithThisLastMessage = await entityManager
        .getRepository(ConversationMember)
        .find({
          where: {
            conversation_id: messageEntity.conversationId,
            last_message_id: messageEntity.id,
          },
        });

      for (const cm of membersWithThisLastMessage) {
        const latestMessage = await entityManager
          .getRepository(Message)
          .createQueryBuilder('m')
          .where('m.conversation_id = :conversationId', {
            conversationId: messageEntity.conversationId,
          })
          .andWhere('m.deleted_at IS NULL')
          .andWhere(
            `NOT EXISTS (
              SELECT 1 FROM chat.deleted_messages dm
              WHERE dm.message_id = m.id AND dm.user_id = :cmUserId
            )`,
            { cmUserId: cm.user_id },
          )
          .orderBy('m.created_at', 'DESC')
          .getOne();

        cm.last_message_id = latestMessage ? latestMessage.id : null;
        await entityManager.save(ConversationMember, cm);
      }
    });

    const updated = await this.getMessageById(messageEntity.id);
    return updated!;
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
