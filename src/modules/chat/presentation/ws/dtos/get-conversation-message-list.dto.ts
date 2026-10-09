import { IsInt, IsNotEmpty, IsNumberString } from 'class-validator';

export class GetConversationMessageListRequest {
  @IsNotEmpty({ message: 'ConversationId should not be empty' })
  @IsNumberString()
  conversationId: string;

  @IsInt()
  page: number;

  @IsInt()
  pageSize: number;
}

export class UserConversationMessageItemUser {
  id: string;
  name: string;
}

export class UserConversationMessageItemReplyTo {
  id: string;
  content: string | null;
  createdAt: string;
  senderId: string;
  user?: UserConversationMessageItemUser | null;
}

export class UserConversationMessageItem {
  id: string;
  content: string | null;
  seen: boolean;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  user: UserConversationMessageItemUser;
  replyToMessageId?: string | null;
  replyTo?: UserConversationMessageItemReplyTo | null;
}

export class UserConversationMessageList {
  list: UserConversationMessageItem[];
  page: number;
  pageSize: number;
  total: number;
}

export class UserConversationMessageMember {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  isBlocked: boolean;
}

export class GetConversationMessageListResponse {
  id: string;
  name?: string;
  avatar?: string;
  username?: string;
  members: Partial<UserConversationMessageMember>[];
  messages: UserConversationMessageList;
}
