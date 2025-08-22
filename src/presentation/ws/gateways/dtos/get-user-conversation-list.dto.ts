import { IsInt, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class GetUserConversationListRequest {
  @IsNotEmpty()
  @IsNumberString({}, { message: 'userId should be a number string' })
  targetUserId: string;

  @IsNotEmpty()
  @IsString({ message: 'filter should be a string' })
  filter: string;

  @IsNotEmpty()
  @IsInt({ message: 'page should be an int' })
  page: number;

  @IsNotEmpty()
  @IsInt({ message: 'pageSize should be an int' })
  pageSize: number;
}

export class UserConversationListItemChatUser {
  id: string;
  name: string;
}

export class UserConversationListItemChat {
  id: string;
  content: string;
  seen: boolean;
  createdAt: string;
  user: UserConversationListItemChatUser;
}

export class UserConversationListItem {
  id: string;
  name: string;
  avatar: string;
  username: string;
  lastMessage: UserConversationListItemChat;
  notSeenCount: number;
}

export class GetUserConversationListResponse {
  list: UserConversationListItem[];
  page: number;
  pageSize: number;
  total: number;
}
