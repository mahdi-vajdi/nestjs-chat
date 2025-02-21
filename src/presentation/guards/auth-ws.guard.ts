import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IncomingMessage } from 'http';
import { Socket } from 'socket.io';
import { StdResponse } from '@common/std-response/std-response';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { AuthService } from '@application/auth/services/auth.service';

@Injectable()
export class AuthWsGuard implements CanActivate {
  private readonly logger = new Logger(AuthWsGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();

    // TODO: Check if token is not blacklisted

    const accessToken = this.extractToken(client.request);
    if (accessToken) {
      data.ack(
        StdResponse.fromResult(
          Result.error('No token provided.', ErrorCode.UNAUTHENTICATED),
        ),
      );
      return false;
    }

    const verifyRes = await this.authService.verifyAccessToken(accessToken);
    if (verifyRes.isError()) {
      this.logger.warn(
        `Error verifying access token: ${verifyRes.error.message}`,
      );
      data.ack(StdResponse.fromResult(verifyRes));
      return false;
    }

    // Set the user ID to the client
    client.data.data['user'] = verifyRes.value;

    return true;
  }

  private extractToken(request: IncomingMessage): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
