import { BaseWsEvent } from '@common/websocket/base-ws-event';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';

export class UserMessageDeletedEvent extends BaseWsEvent<UserMessageDeleted> {
  get eventName(): string {
    return 'conversation.message.deleted';
  }
}

export class UserMessageDeleted {
  id: string;
  conversationId: string;
  scope: MessageDeleteScope;
  deletedAt?: string;
}
