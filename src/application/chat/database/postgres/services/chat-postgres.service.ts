import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

@Injectable()
export class ChatPostgresService implements ChatDatabaseProvider {
  constructor(
    @InjectRepository(Conversation, DatabaseType.POSTGRES)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message, DatabaseType.POSTGRES)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ConversationMember, DatabaseType.POSTGRES)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
  ) {}

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
    // TODO: add condition for deleted chats
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
            .select()
            .from(Message, 'message')
            .where('message.conversation_id = cm.conversation_id')
            .andWhere('message.id > cm.last_seen_message_id'),
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
}
