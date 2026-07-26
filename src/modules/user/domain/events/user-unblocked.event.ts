export class UserUnblockedEvent {
  constructor(
    public readonly unblockerId: string,
    public readonly unblockedId: string,
  ) {}
}
