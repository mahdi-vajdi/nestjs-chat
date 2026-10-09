import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';

export class DeleteMessageRequest {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  messageId: string;

  @IsNotEmpty()
  @IsEnum(MessageDeleteScope, {
    message: 'scope must be either ME or EVERYONE',
  })
  scope: MessageDeleteScope;
}

export class DeleteMessageResponse {
  id: string;
  conversationId: string;
  scope: MessageDeleteScope;
}
