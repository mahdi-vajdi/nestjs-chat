import { IsNotEmpty, IsString } from 'class-validator';

export class MessageSeenDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;
}
