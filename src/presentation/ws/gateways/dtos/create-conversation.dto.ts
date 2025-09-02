import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateConversationRequest {
  @IsNotEmpty()
  @IsNumberString()
  targetUserId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}

export class CreateConversationMessageUser {
  id: string;
  name: string;
}

export class CreateConversationMessage {
  id: string;
  content: string;
  seen: boolean;
  createdAt: string;
  user: CreateConversationMessageUser;
}

export class CreateConversationResponse {
  id: string;
  name: string;
  avatar: string;
  username: string;
  createdAt: string;
  chat?: CreateConversationMessage;
}
