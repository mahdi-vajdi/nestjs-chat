export class GetUserConversationQuery {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
  ) {}
}
