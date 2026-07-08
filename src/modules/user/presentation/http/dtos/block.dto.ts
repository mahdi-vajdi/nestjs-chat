import { IsNotEmpty, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  targetUserId: string;
}

export class BlockResponse {}
