import {
  CanActivate,
  ExecutionContext,
  Injectable,
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
    const { authorization } = client.handshake.headers; // Used for postman
    // const { token } = client.handshake.auth; // Used for socket.io-client

    console.log(
      `ws-jwt-auth-guard: ${{
        time: new Date(),
        token: JSON.stringify(authorization),
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
    const { authorization } = client.handshake.headers;
    if (!authorization)
      throw new UnauthorizedException(
        'Could not find any authoriztion credentials',
      );
    const token: string = authorization.split(' ')[1];
    const payload = jwtService.verify(token);
    return payload;
  }
}
