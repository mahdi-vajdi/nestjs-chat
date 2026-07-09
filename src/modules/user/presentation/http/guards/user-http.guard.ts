
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthIntegrationPort } from '@user/application/ports/auth-integration.port';

@Injectable()
export class UserHttpGuard implements CanActivate {
  private readonly logger = new Logger(UserHttpGuard.name);

  constructor(private readonly authIntegrationPort: AuthIntegrationPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      this.logger.log('User did not provide access token. retuning error.');
      throw new UnauthorizedException('No access token was provided.');
    }

    const verifyTokenRes = await this.authIntegrationPort.verifyToken(accessToken);
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

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
