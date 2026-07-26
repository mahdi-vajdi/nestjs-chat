import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnblockRequestParams {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  targetUserId: string;
}

export class UnblockResponse {}
