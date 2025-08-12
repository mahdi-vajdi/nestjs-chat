import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@chat/database/postgres/entities/message.entity';
import { ChatDatabaseProvider } from '@chat/database/providers/chat-database.provider';
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { GetUserConversationIdsOptions } from '@chat/database/providers/options/get-user-conversation-ids.options';

@Injectable()
export class ChatPostgresService implements ChatDatabaseProvider {
  constructor(
    @InjectRepository(Conversation, DatabaseType.POSTGRES)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message, DatabaseType.POSTGRES)
    private readonly messageRepository: Repository<Message>,
  ) {}

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
}
