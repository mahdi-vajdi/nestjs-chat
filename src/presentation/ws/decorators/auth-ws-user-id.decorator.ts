import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ClientData } from '@presentation/ws/client-data.interface';
import { AccessTokenPayload } from '@auth/types/access-token-payload.type';

export const AuthWsUserId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const clientData = context
      .switchToWs()
      .getClient<Socket<any, any, any, ClientData>>().data;
    const wsData = context.switchToWs().getData();
    const authUser =
      clientData.authUser || (wsData['authUser'] as AccessTokenPayload);

    return authUser.sub;
  },
);
