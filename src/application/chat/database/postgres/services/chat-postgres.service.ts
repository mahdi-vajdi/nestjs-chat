import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@chat/database/postgres/entities/message.entity';
import { ChatDatabaseProvider } from '@chat/database/providers/chat-database.provider';
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { GetUserConversationIdsOptions } from '@chat/database/options/get-user-conversation-ids.options';
import { GetUserConversationListOptions } from '@chat/database/options/get-user-conversation-list.options';
import { ConversationEntity } from '@chat/models/conversation.model';
import { ConversationMember } from '@chat/database/postgres/entities/conversation-member.entity';
import { ConversationMemberEntity } from '@chat/models/conversation-member.model';
import { GetConversationMembersOptions } from '@chat/database/options/get-conversation-members.options';
import { ConversationType } from '@chat/enums/conversation-type.enum';
import { randomUUID } from 'crypto';
import { MessageEntity, MessageProps } from '@chat/models/message.entity';
import { DeletedMessage } from '@chat/database/postgres/entities/deleted-message.entity';
import { ErrorCode } from '@common/result/error';
import { PaginationOptions } from '@common/pagination/pagination.interface';

@Injectable()
export class ChatPostgresService implements ChatDatabaseProvider {
  constructor(
    @InjectRepository(Conversation, DatabaseType.POSTGRES)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message, DatabaseType.POSTGRES)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ConversationMember, DatabaseType.POSTGRES)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
    @InjectDataSource(DatabaseType.POSTGRES)
    private readonly dataSource: DataSource,
  ) {}

  @TryCatch
  async conversationExists(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>> {
    const res = await this.conversationRepository
      .createQueryBuilder('c')
      .innerJoin('c.conversationMembers', 'cm', 'cm.user_id = :userId', {
        userId,
      })
      .where('c.type = :type', { type: ConversationType.DIRECT })
      .andWhereExists(
        this.conversationMemberRepository
          .createQueryBuilder('target_cm')
          .where('target_cm.conversation_id = c.id')
          .andWhere('target_cm.user_id = :targetUserId', { targetUserId }),
      )
      .getExists();

    return Result.ok(res);
  }

  @TryCatch
  async createDirectConversation(
    userId: string,
    targetUserId: string,
  ): Promise<Result<ConversationEntity>> {
    const res = await this.dataSource.transaction(async (entityManager) => {
      const conversation = await entityManager.save(
        Conversation.fromProps({
          type: ConversationType.DIRECT,
          members: [],
          identifier: randomUUID(),
          title: null,
          picture: null,
          messages: [],
        }),
      );

      conversation.conversationMembers = await entityManager.save([
        ConversationMember.fromProps({
          userId: userId,
          conversation: { id: conversation.id },
          lastSeenMessage: null,
          lastMessage: null,
        }),
        ConversationMember.fromProps({
          userId: targetUserId,
          conversation: { id: conversation.id },
          lastSeenMessage: null,
          lastMessage: null,
        }),
      ]);

      return conversation;
    });

    return Result.ok(Conversation.toEntity(res));
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

      return deleteConversation.affected == 1;
    });

    return Result.ok(res);
  }

  @TryCatch
  async createMessage(props: MessageProps): Promise<Result<MessageEntity>> {
    const res = await this.dataSource.transaction(async (entityManager) => {
      const message = await entityManager.save(Message.fromProps(props));

      const deletedMessages = props.deletedForUserIds.map((userId) => {
        const deletedMessage = new DeletedMessage();
        deletedMessage.user_id = userId;
        deletedMessage.message_id = message.id;
        return deletedMessage;
      });

      await Promise.all([
        // Set the last message id for user's in the conversation
        entityManager
          .getRepository(ConversationMember)
          .createQueryBuilder()
          .update()
          .set({
            last_message_id: message.id,
          })
          .where('conversation_id = :conversationId', {
            conversationId: message.conversation_id,
          })
          // Skip user's that are in the deleted chats
          .andWhere('user_id NOT IN (:...deletedForUserIds)', {
            deletedForUserIds: props.deletedForUserIds,
          })
          .execute(),
        // Set the last seen message for the sender user
        entityManager
          .getRepository(ConversationMember)
          .createQueryBuilder()
          .update()
          .set({
            last_seen_message_id: message.id,
          })
          .where('id = :memberId', { memberId: message.sender_id })
          .execute(),
        // Save the deleted messages
        entityManager.insert(DeletedMessage, deletedMessages),
      ]);

      return message;
    });

    const entity = Message.toEntity(res);
    entity.deletedForUserIds = props.deletedForUserIds;

    return Result.ok(entity);
  }

  @TryCatch
  async getUserConversationList(
    userId: string,
    options: GetUserConversationListOptions,
  ): Promise<Result<[ConversationEntity[], number]>> {
    const query = this.conversationRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect(
        'c.conversationMembers',
        'cm',
        'cm.user_id = :userId',
        { userId },
      );

    if (options.withLastMessage) {
      query
        .leftJoinAndSelect('cm.lastMessage', 'lastMessage')
        .leftJoinAndSelect('lastMessage.sender', 'lastMessageSender');
    }

    if (options.filterUserIds.length > 0) {
      query.andWhereExists(
        this.conversationMemberRepository
          .createQueryBuilder('cm')
          .where('cm.user_id IN (:...userIds)', {
            userIds: options.filterUserIds,
          })
          .andWhere('cm.conversation_id = c.id'),
      );
    }

    if (options.type != null) {
      query.andWhere('c.type = :type', { type: options.type });
    }

    if (options.pagination) {
      query.offset(options.pagination.offset).limit(options.pagination.limit);
    }

    if (options.withLastMessage) {
      query.orderBy('lastMessage.created_at', 'DESC');
    } else {
      query.orderBy('c.created_at', 'DESC');
    }

    const [res, count] = await query.getManyAndCount();

    return Result.ok([res.map((conv) => Conversation.toEntity(conv)), count]);
  }

  @TryCatch
  async getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<Result<string[]>> {
    const query = this.conversationRepository
      .createQueryBuilder('c')
      .select('c.id', 'id')
      .innerJoin('c.conversationMembers', 'cm', 'cm.user_id = :userId', {
        userId,
      });

    if (options.type != null) {
      query.andWhere('c.type = :type', { type: options.type });
    }

    const res = await query.getMany().then((rows) => rows.map((c) => c.id));

    return Result.ok(res);
  }

  @TryCatch
  async getConversationsNotSeenCounts(
    userId: string,
    conversationIds: string[],
  ): Promise<Result<Record<string, number>>> {
    // TODO: use create date for not seen chats instead of id
    const res = await this.conversationMemberRepository
      .createQueryBuilder('cm')
      .select('cm.conversation_id', 'conversationId')
      .where('cm.user_id = :userId', { userId })
      .andWhere('cm.conversation_id = ANY(:...conversationIds)', {
        conversationIds,
      })
      .addSelect(
        (qb: SelectQueryBuilder<any>) =>
          qb
            .select('COUNT(m.id) - COUNT(dm.id)')
            .from(Message, 'm')
            .leftJoin(
              DeletedMessage,
              'dm',
              'm.id = dm.id AND dm.user_id = :userId',
              { userId },
            )
            .where('m.conversation_id = cm.conversation_id')
            .andWhere('m.id > cm.last_seen_message_id'),
        'notSeenCount',
      )
      .getRawMany();

    const counts: Record<string, number> = {};
    res.forEach((r) => (counts[r.cm_conversation_id] = r.cm_notSeenCount));

    return Result.ok(counts);
  }

  @TryCatch
  async getConversationMembers(
    conversationIds: string[],
    options: GetConversationMembersOptions,
  ): Promise<Result<ConversationMemberEntity[]>> {
    const query = this.conversationMemberRepository
      .createQueryBuilder('cm')
      .where('cm.conversation_id = ANY(:conversationIds)', { conversationIds });

    if (options.excludeUserId) {
      query.andWhere('cm.user_id <> :excludeUserId', {
        excludeUserId: options.excludeUserId,
      });
    }

    const res = await query.getMany();

    return Result.ok(res.map((cm) => ConversationMember.toEntity(cm)));
  }

  @TryCatch
  async getUserConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Result<ConversationEntity>> {
    const res = await this.conversationRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.conversationMembers', 'cm')
      .where('c.id = :conversationId', { conversationId })
      .andWhereExists(
        this.conversationMemberRepository
          .createQueryBuilder('sub_cm')
          .where('sub_cm.user_id = :userId', { userId })
          .andWhere('sub_cm.conversation_id = c.id'),
      )
      .getOne();

    if (!res) {
      return Result.error('Conversation not found.', ErrorCode.NOT_FOUND);
    }

    return Result.ok(Conversation.toEntity(res));
  }

  @TryCatch
  async getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<Result<[MessageEntity[], number]>> {
    const [messages, count] = await this.dataSource.transaction(
      async (entityManager) => {
        const res = await entityManager
          .getRepository(Message)
          .createQueryBuilder('m')
          .innerJoinAndSelect('m.sender', 'cm')
          .where('m.conversation_id = :conversationId', { conversationId })
          .andWhere(() => {
            const sq = entityManager
              .getRepository(DeletedMessage)
              .createQueryBuilder('dm')
              .where('dm.user_id = :userId')
              .andWhere('dm.message_id = m.id')
              .getQuery();

            return `NOT EXISTS (${sq})`;
          })
          .setParameter('userId', userId)
          .orderBy('m.created_at', 'DESC')
          .offset(pagination.offset)
          .limit(pagination.limit)
          .getManyAndCount();

        // Update last seen message for the user
        if (res[0].length) {
          await entityManager
            .getRepository(ConversationMember)
            .createQueryBuilder()
            .update()
            .set({
              last_seen_message_id: res[0][0].id,
            })
            .where('user_id = :userId', { userId })
            .andWhere('conversation_id = :conversationId', { conversationId })
            .execute();
        }

        return res;
      },
    );

    return Result.ok([
      messages.map((message) => Message.toEntity(message)),
      count,
    ]);
  }
}
