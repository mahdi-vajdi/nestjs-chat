import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMessageRequest {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  replyToMessageId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clientMessageId?: string;
}

export class CreateMessageResponseUser {
  id: string;
  name: string;
}

export class CreateMessageReplyToUser {
  id: string;
  name: string;
}

export class CreateMessageReplyTo {
  id: string;
  content: string | null;
  createdAt: string;
  senderId: string;
  user?: CreateMessageReplyToUser | null;
}

export class CreateMessageResponseResponse {
  id: string;
  content: string;
  seen: boolean;
  createdAt: string;
  user: CreateMessageResponseUser;
  replyTo?: CreateMessageReplyTo | null;
  clientMessageId?: string | null;
}
