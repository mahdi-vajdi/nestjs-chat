import { MessageReadDto } from '@chat/application/dtos/message-read.dto';

export interface ConversationMemberReadDto {
  id: string;
  userId: string;
  lastSeenMessageId: string | null;
  lastMessageId: string | null;
}

export interface ConversationReadDto {
  id: string;
  type: string;
  identifier: string | null;
  title: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMemberReadDto[];
  lastMessage: MessageReadDto | null;
  notSeenCount: number;
}
