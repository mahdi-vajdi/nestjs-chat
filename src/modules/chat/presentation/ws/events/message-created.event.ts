import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class UserMessageCreatedEvent extends BaseWsEvent<UserMessageCreated> {
  get eventName(): string {
    return 'conversation.message.created';
  }
}

export class UserMessageCreated {
  id: string;
  content: string;
  seen: boolean;
  conversation: UserMessageCreatedConversation;
  createdAt: string;
  user: UserMessageCreatedUser;
}

export class UserMessageCreatedConversation {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export class UserMessageCreatedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}
