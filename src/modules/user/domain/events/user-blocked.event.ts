export class UserBlockedEvent {
  constructor(
    public readonly blockerId: string,
    public readonly blockedId: string,
  ) {}
}
