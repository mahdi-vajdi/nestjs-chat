import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninRequestBody {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  property: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class SigninUserItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  createdAt: string;
}

export class SigninTokenItem {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class SigninResponse {
  @ApiProperty()
  user: SigninUserItem;

  @ApiProperty()
  tokens: SigninTokenItem;
}
