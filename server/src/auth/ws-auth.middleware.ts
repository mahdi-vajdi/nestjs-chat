import { Socket } from 'socket.io';
import { WsJwtAuthGuard } from './guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
export type SocketWithUser = Socket & { username: string; userId: string };

type SocketIOMiddleware = {
  (client: SocketWithUser, next: (err?: Error) => void);
};

export const SocketAuthMiddleware = (
  jwtService: JwtService,
): SocketIOMiddleware => {
  return (client, next) => {
    try {
      const payload = WsJwtAuthGuard.validateToken(client, jwtService);
      client.username = payload.username;
      client.userId = payload.sub;
      next();
    } catch (error) {
      next(error);
    }
  };
};
