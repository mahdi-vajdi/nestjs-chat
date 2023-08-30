import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') return true;

    const client: Socket = context.switchToWs().getClient();
    // if we use a frontend, it's suggested that we use: 'client.handshake.auth' as a statndard
    const { authorization } = client.handshake.headers;

    Logger.log('ws-jwt-auth-guard', { authorization });

    WsJwtAuthGuard.validateToken(client, this.jwtService);
    return true;
  }

  static validateToken(client: Socket, jwtService: JwtService) {
    const { authorization } = client.handshake.headers;
    Logger.log('authorizaion', { authorization });
    const token: string = authorization.split(' ')[1];
    const payload = jwtService.verify(token);
    return payload;
  }
}
