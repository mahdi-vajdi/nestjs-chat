export interface QuotedMessageReadDto {
  id: string;
  text: string | null;
  type: string;
  senderId: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface MessageReadDto {
  id: string;
  text: string;
  type: string;
  senderId: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyToMessageId?: string | null;
  replyTo?: QuotedMessageReadDto | null;
}
