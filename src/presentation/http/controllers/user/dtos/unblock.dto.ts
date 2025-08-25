import { IsNotEmpty, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnblockRequestParams {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  targetUserId: string;
}

export class UnblockResponse {}
