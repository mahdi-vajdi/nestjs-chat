import { GetUserConversationIdsOptions } from '@chat/application/ports/options/get-user-conversation-ids.options';

export class GetUserConversationIdsQuery {
  constructor(
    public readonly userId: string,
    public readonly options: GetUserConversationIdsOptions,
  ) {}
}
