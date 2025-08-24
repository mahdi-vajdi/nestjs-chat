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
