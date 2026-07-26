export class GetBlockedUsersIdsQuery {
  constructor(
    public readonly userId: string,
    public readonly targetUserIds: string[],
  ) {}
}
