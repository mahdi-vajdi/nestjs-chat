export class EditMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly text: string,
  ) {}
}
