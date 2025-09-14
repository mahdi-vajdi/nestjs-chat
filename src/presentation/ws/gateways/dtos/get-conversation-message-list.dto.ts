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

export class UserConversationMessageItem {
  id: string;
  content: string;
  seen: boolean;
  createdAt: string;
  user: UserConversationMessageItemUser;
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
