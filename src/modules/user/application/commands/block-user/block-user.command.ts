export class BlockUserCommand {
  constructor(
    public readonly blockerId: string,
    public readonly blockedId: string,
  ) {}
}
