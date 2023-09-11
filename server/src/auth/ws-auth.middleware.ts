import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

export type SocketWithAuth = Socket & { username: string; userId: string };

type SocketIOMiddleware = {
  (client: SocketWithAuth, next: (err?: Error) => void);
};

export const SocketAuthMiddleware = (
  jwtService: JwtService,
): SocketIOMiddleware => {
  return (client, next) => {
    // for Postman testing support, fallback to authorization header
    const token =
      client.handshake.auth.token || client.handshake.headers['authorization'];

    try {
      const payload = jwtService.verify(token);
      client.username = payload.username;
      client.userId = payload.sub;
      next();
    } catch (error) {
      next(new Error('Forbidden'));
    }
  };
};
