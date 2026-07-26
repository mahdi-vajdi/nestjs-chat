import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class MarkMessageSeenRequest {
  @IsNotEmpty({ message: 'ConversationId should not be empty' })
  @IsNumberString()
  conversationId: string;

  @IsNotEmpty({ message: 'MessageId should not be empty' })
  @IsString()
  messageId: string;
}
