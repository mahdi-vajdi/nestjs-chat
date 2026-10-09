import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutRequestBody {
  @ApiPropertyOptional({
    description: 'Specific refresh token to revoke (if omitted, revokes all)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({
    description: 'Whether to log out from all devices/sessions',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}

export class LogoutResponse {
  @ApiPropertyOptional({ default: true })
  success: boolean;
}
