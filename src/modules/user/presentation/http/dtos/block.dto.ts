import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  targetUserId: string;
}

export class BlockResponse {}
