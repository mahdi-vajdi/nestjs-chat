export class CreateDirectConversationCommand {
  constructor(
    public readonly userId: string,
    public readonly targetUserId: string,
  ) {}
}
