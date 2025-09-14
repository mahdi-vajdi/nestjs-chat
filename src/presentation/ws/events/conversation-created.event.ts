import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class ConversationCreatedEvent extends BaseWsEvent<ConversationCreated> {
  get eventName(): string {
    return 'user.conversation.created';
  }
}

export class ConversationCreated {
  id: string;
  name: string;
  avatar: string;
  username: string;
  lastMessage: ConversationMessage;
  notSeenCount: number;
}

export class ConversationMessage {
  id: string;
  content: string;
  seen: boolean;
  createdAt: string;
  user: ConversationMessageUser;
}

export class ConversationMessageUser {
  id: string;
  name: string;
}
