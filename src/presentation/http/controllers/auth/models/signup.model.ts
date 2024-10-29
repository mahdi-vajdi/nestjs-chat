import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class SignupRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  lastName: string;
}

export class SignupResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;
}
