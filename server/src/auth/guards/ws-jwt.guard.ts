import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') return true;

    const client: Socket = context.switchToWs().getClient();
    // if we use a frontend, it's suggested that we use: 'client.handshake.auth' as a statndard
    const { token } = client.handshake.auth;

    console.log(
      `ws-jwt-auth-guard: ${{
        time: new Date(),
        token: JSON.stringify(token),
      }}`,
    );

    WsJwtAuthGuard.validateToken(client, this.jwtService);
    // const user = this.authService.getUserByUsername(payload.username);

    // console.log('ws-jwt-guard ' + user);

    // set user to the client
    // context.switchToWs().getClient().user = user;

    return true;
  }

  static validateToken(client: Socket, jwtService: JwtService) {
    const { token } = client.handshake.auth;
    if (!token)
      throw new UnauthorizedException(
        'Could not find any authoriztion credentials',
      );
    const payload = jwtService.verify(token);
    return payload;
  }
}