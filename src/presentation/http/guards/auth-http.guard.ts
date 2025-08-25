import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '@auth/services/auth.service';

@Injectable()
export class AuthHttpGuard implements CanActivate {
  private readonly logger = new Logger(AuthHttpGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO: Check if token is not blacklisted

    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      this.logger.log('User did not provide access token. retuning error.');
      throw new UnauthorizedException('No access token was provided.');
    }

    const verifyTokenRes =
      await this.authService.verifyAccessToken(accessToken);
    if (verifyTokenRes.isError()) {
      this.logger.warn(
        `Error verifying access token: ${verifyTokenRes.error.message}`,
      );
      throw new UnauthorizedException('Invalid access token.');
    }

    Object.assign(request, {
      authUser: verifyTokenRes.value,
      accessToken: accessToken,
    });

    // TODO: Check user role

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
