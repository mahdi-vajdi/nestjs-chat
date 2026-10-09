import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class UserMessageCreatedEvent extends BaseWsEvent<UserMessageCreated> {
  get eventName(): string {
    return 'conversation.message.sent';
  }
}

export class UserMessageCreatedReplyTo {
  id: string;
  content: string | null;
  createdAt: string;
  senderId: string;
  user?: UserMessageCreatedUser | null;
}

export class UserMessageCreated {
  id: string;
  content: string;
  seen: boolean;
  conversation: UserMessageCreatedConversation;
  createdAt: string;
  user: UserMessageCreatedUser;
  replyToMessageId?: string | null;
  replyTo?: UserMessageCreatedReplyTo | null;
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
