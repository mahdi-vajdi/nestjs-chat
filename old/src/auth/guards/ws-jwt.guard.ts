import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthPayload } from '../auth.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') return true;

    const client: Socket = context.switchToWs().getClient();
    const token =
      client.handshake.auth.token || client.handshake.headers['authorization'];

    if (!token) throw new WsException('Unauthorized: No token provided');

    try {
      const payload = this.jwtService.verify<AuthPayload>(token);

      if (payload) return true;
    } catch (error) {
      throw new WsException('Forbidden');
    }
  }
}
