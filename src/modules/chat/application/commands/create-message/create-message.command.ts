import { MessageType } from '@chat/domain/enums/chat-type.enum';

export class CreateMessageCommand {
  constructor(
    public readonly text: string,
    public readonly type: MessageType,
    public readonly senderId: string,
    public readonly conversationId: string,
    public readonly deletedForUserIds: string[] = [],
  ) {}
}
