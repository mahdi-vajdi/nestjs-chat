import { GetUserConversationListOptions } from '@chat/application/ports/options/get-user-conversation-list.options';

export class GetUserConversationListQuery {
  constructor(
    public readonly userId: string,
    public readonly options: GetUserConversationListOptions,
  ) {}
}
