import { IsNotEmpty, IsString } from 'class-validator';

export class MessageSeenDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  senderUsername: string;

  @IsString()
  @IsNotEmpty()
  chatId: string;
}
