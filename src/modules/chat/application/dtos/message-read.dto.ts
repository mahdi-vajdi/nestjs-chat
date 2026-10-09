export interface MessageReadDto {
  id: string;
  text: string;
  type: string;
  senderId: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}
