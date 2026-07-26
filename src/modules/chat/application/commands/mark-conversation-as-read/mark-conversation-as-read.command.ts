import { ICommand } from '@nestjs/cqrs';

export class MarkConversationAsReadCommand implements ICommand {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly messageId: string,
  ) {}
}
