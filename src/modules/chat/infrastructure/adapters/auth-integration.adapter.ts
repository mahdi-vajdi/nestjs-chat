import { Injectable } from '@nestjs/common';
import {
  AuthIntegrationPort,
  ValidatedTokenPayload,
} from '@chat/application/ports/auth-integration.port';
import { AuthService } from '@auth/application/services/auth.service';
import { Result } from '@common/result/result';

@Injectable()
export class AuthIntegrationAdapter implements AuthIntegrationPort {
  constructor(private readonly authService: AuthService) {}

  async verifyToken(token: string): Promise<Result<ValidatedTokenPayload>> {
    const res = await this.authService.verifyAccessToken(token);
    if (res.isError()) return Result.error(res.error);
    return Result.ok({
      sub: res.value.sub,
      role: res.value.role,
      exp: res.value.exp,
    });
  }
}
