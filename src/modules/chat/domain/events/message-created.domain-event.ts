export class MessageCreatedDomainEvent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly text: string,
    public readonly deletedForUserIds: string[],
    public readonly createdAt: Date,
  ) {}
}
