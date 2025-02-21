import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '@application/auth/services/auth.service';

@Injectable()
export class AuthHttpGuard implements CanActivate {
  private readonly logger = new Logger(AuthHttpGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO: Check if token is not blacklisted

    const request = context.switchToHttp().getRequest<Request>();

    // Extract the access token from the header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.log('User did not provide access token. retuning error.');
      throw new UnauthorizedException('No access token was provided.');
    }

    // Verify the request access token
    const verifyTokenRes = await this.authService.verifyAccessToken(token);
    if (verifyTokenRes.isError()) {
      this.logger.warn(
        `Error verifying access token: ${verifyTokenRes.error.message}`,
      );
      throw new UnauthorizedException('Invalid access token.');
    }

    // Set the token payload ID to the request
    request['authUser'] = verifyTokenRes.value;

    // TODO: Check user role

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
