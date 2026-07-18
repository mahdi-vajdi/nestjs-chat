export class UnblockUserCommand {
  constructor(
    public readonly unblockerId: string,
    public readonly unblockedId: string,
  ) {}
}
