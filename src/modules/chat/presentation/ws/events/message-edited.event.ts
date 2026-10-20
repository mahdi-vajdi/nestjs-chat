import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class UserMessageEditedEvent extends BaseWsEvent<UserMessageEdited> {
  get eventName(): string {
    return 'conversation.message.edited';
  }
}

export class UserMessageEdited {
  id: string;
  conversationId: string;
  content: string;
  editedAt: string;
}
