import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class SignupRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 5 })
  @IsNotEmpty()
  @Length(5)
  @IsStrongPassword()
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
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  createdAt: string;
}
