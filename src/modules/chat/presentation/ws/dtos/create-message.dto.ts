import { IsNotEmpty, IsNumberString, MinLength } from 'class-validator';

export class CreateMessageRequest {
  @IsNotEmpty()
  @IsNumberString()
  conversationId: string;

  @IsNotEmpty()
  @MinLength(1)
  text: string;
}

export class CreateMessageResponseUser {
  id: string;
  name: string;
}

export class CreateMessageResponseResponse {
  id: string;
  content: string;
  seen: boolean;
  createdAt: string;
  user: CreateMessageResponseUser;
}
