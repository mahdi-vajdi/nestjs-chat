import { MessageReadDto } from '@modules/chat/application/dtos/message-read.dto';
import { ConversationReadDto } from '@modules/chat/application/dtos/conversation-read.dto';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@modules/chat/infrastructure/database/entities/message.entity';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { Conversation } from '@modules/chat/infrastructure/database/entities/conversation.entity';
import { GetUserConversationIdsOptions } from '@modules/chat/application/ports/options/get-user-conversation-ids.options';
import { GetUserConversationListOptions } from '@modules/chat/application/ports/options/get-user-conversation-list.options';
import { ConversationMember } from '@modules/chat/infrastructure/database/entities/conversation-member.entity';
import { DeletedMessage } from '@modules/chat/infrastructure/database/entities/deleted-message.entity';
import {
  PaginatedResult,
  PaginationOptions,
} from '@common/pagination/pagination.interface';
import { PaginationHelper } from '@common/pagination/pagination.helper';

@Injectable()
export class ConversationPostgresReadRepository implements ConversationReadRepositoryPort {
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

  async conversationExists(
    userId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const res = await this.conversationRepository
      .createQueryBuilder('c')
      .innerJoin('c.conversationMembers', 'cm', 'cm.user_id = :userId', {
        userId,
      })
      .where('c.type = :type', { type: 'DIRECT' })
      .andWhereExists(
        this.conversationMemberRepository
          .createQueryBuilder('target_cm')
          .where('target_cm.conversation_id = c.id')
          .andWhere('target_cm.user_id = :targetUserId', { targetUserId }),
      )
      .getExists();

    return res;
  }

  async getUserConversationList(
    userId: string,
    options: GetUserConversationListOptions,
  ): Promise<PaginatedResult<ConversationReadDto>> {
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

    if (options.filterUserIds && options.filterUserIds.length > 0) {
      query.andWhereExists(
        this.conversationMemberRepository
          .createQueryBuilder('cm_filter')
          .where('cm_filter.user_id IN (:...userIds)', {
            userIds: options.filterUserIds,
          })
          .andWhere('cm_filter.conversation_id = c.id'),
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

    const [conversations, count] = await query.getManyAndCount();

    if (conversations.length === 0) {
      return PaginationHelper.createResult([], count, options.pagination);
    }

    const conversationIds = conversations.map((c) => c.id);

    // Fetch not seen counts
    const notSeenCountsQuery = await this.conversationMemberRepository
      .createQueryBuilder('cm')
      .select('cm.conversation_id', 'conversationId')
      .where('cm.user_id = :userId', { userId })
      .andWhere('cm.conversation_id IN (:...conversationIds)', {
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

    const notSeenCountsMap = new Map<string, number>();
    notSeenCountsQuery.forEach((row) => {
      notSeenCountsMap.set(
        row.conversationId,
        parseInt(row.notSeenCount, 10) || 0,
      );
    });

    // Map to DTOs
    const dtos: ConversationReadDto[] = conversations.map((conv) => {
      const currentMember = conv.conversationMembers.find(
        (cm) => cm.user_id === userId,
      );

      return {
        id: conv.id,
        type: conv.type,
        identifier: conv.identifier,
        title: conv.title,
        picture: conv.picture,
        createdAt: conv.created_at.toISOString(),
        updatedAt: conv.updated_at.toISOString(),
        notSeenCount: notSeenCountsMap.get(conv.id) || 0,
        lastMessage: currentMember?.lastMessage
          ? {
              id: currentMember.lastMessage.id,
              text: currentMember.lastMessage.text,
              type: currentMember.lastMessage.type,
              senderId: currentMember.lastMessage.sender_id,
              createdAt: currentMember.lastMessage.created_at.toISOString(),
            }
          : null,
        members: conv.conversationMembers.map((cm) => ({
          id: cm.id,
          userId: cm.user_id,
          lastSeenMessageId: cm.last_seen_message_id,
          lastMessageId: cm.last_message_id,
        })),
      };
    });

    // Populate other members for direct conversations manually if needed
    const allMembers = await this.conversationMemberRepository
      .createQueryBuilder('cm')
      .where('cm.conversation_id IN (:...conversationIds)', { conversationIds })
      .getMany();

    dtos.forEach((dto) => {
      const membersForThisConv = allMembers.filter(
        (m) => m.conversation_id === dto.id && m.user_id !== userId,
      );
      membersForThisConv.forEach((m) => {
        dto.members.push({
          id: m.id,
          userId: m.user_id,
          lastSeenMessageId: m.last_seen_message_id,
          lastMessageId: m.last_message_id,
        });
      });
    });

    return PaginationHelper.createResult(dtos, count, options.pagination);
  }

  async getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<string[]> {
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

    return res;
  }

  async getUserConversationById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationReadDto | null> {
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
      return null;
    }

    const dto: ConversationReadDto = {
      id: res.id,
      type: res.type,
      identifier: res.identifier,
      title: res.title,
      picture: res.picture,
      createdAt: res.created_at.toISOString(),
      updatedAt: res.updated_at.toISOString(),
      notSeenCount: 0,
      lastMessage: null,
      members: res.conversationMembers.map((cm) => ({
        id: cm.id,
        userId: cm.user_id,
        lastSeenMessageId: cm.last_seen_message_id,
        lastMessageId: cm.last_message_id,
      })),
    };

    return dto;
  }

  async getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<MessageReadDto>> {
    const [messages, count] = await this.dataSource.transaction(
      async (entityManager) => {
        const queryRes = await entityManager
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

        return queryRes;
      },
    );

    const dtos: MessageReadDto[] = messages.map((m) => ({
      id: m.id,
      text: m.text,
      type: m.type,
      senderId: m.sender_id,
      createdAt: m.created_at.toISOString(),
    }));

    return PaginationHelper.createResult(dtos, count, pagination);
  }
}
