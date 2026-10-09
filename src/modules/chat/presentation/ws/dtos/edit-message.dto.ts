import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EditMessageRequest {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  messageId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  text: string;
}

export class EditMessageResponse {
  id: string;
  content: string;
  editedAt: string;
}
