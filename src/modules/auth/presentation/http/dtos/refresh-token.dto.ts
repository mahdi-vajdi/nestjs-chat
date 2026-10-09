import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokensRequestBody {
  @ApiProperty({ description: 'The refresh token string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class RefreshTokensResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
