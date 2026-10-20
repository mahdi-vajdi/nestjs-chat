import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';

export class DeleteMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly scope: MessageDeleteScope,
  ) {}
}
