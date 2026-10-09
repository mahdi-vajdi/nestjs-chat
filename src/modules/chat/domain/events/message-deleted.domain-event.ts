import { MessageDeleteScope } from '../enums/message-delete-scope.enum';

export class MessageDeletedDomainEvent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly scope: MessageDeleteScope,
    public readonly actorUserId: string,
    public readonly deletedForUserIds: string[],
    public readonly deletedAt?: Date,
  ) {}
}
