import { Socket } from 'socket.io';
import { WsJwtAuthGuard } from './guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from 'src/users/models/user.schema';

export type SocketWithUser = Socket & UserDocument;

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
      client._id = payload.sub;
      next();
    } catch (error) {
      next(error);
    }
  };
};
