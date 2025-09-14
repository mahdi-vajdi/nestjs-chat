import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class MessageSeenEvent extends BaseWsEvent<MessageSeen> {
  get eventName(): string {
    return 'user.conversation.message.seen';
  }
}

export class MessageSeen {
  conversationId: string;
  messageId: string;
}
