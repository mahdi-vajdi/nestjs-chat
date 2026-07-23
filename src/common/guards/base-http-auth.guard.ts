import {
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../http/interfaces/authenticated-request.interface';

export abstract class BaseHttpAuthGuard implements CanActivate {
  protected abstract readonly logger: Logger;

  protected abstract verifyToken(token: string): Promise<any>;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken) {
      this.logger.log('User did not provide access token. returning error.');
      throw new UnauthorizedException('No access token was provided.');
    }

    try {
      const verifyTokenRes = await this.verifyToken(accessToken);
      request.authUser = verifyTokenRes;
      request.accessToken = accessToken;
    } catch (error) {
      this.logger.warn(
        `Error verifying access token: ${(error as Error).message}`,
      );
      throw new UnauthorizedException('Invalid access token.');
    }

    return true;
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
