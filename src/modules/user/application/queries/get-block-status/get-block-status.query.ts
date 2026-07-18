export class GetBlockStatusQuery {
  constructor(
    public readonly userId: string,
    public readonly targetUserId: string,
  ) {}
}
