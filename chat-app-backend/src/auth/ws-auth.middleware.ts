import { Socket } from 'socket.io';
import { WsJwtAuthGuard } from './guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

type SocketIOMiddleware = {
  (client: Socket, next: (err?: Error) => void);
};

export const SocketAuthMiddleware = (
  jwtService: JwtService,
): SocketIOMiddleware => {
  return (client, next) => {
    try {
      WsJwtAuthGuard.validateToken(client, jwtService);
      next();
    } catch (error) {
      next(error);
    }
  };
};
