import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ClientData } from '@common/websocket/interfaces/client-data.interface';

export const CurrentWsUserId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const clientData = context
      .switchToWs()
      .getClient<Socket<any, any, any, ClientData>>().data;
    const wsData = context.switchToWs().getData();
    const authUser = clientData.authUser || wsData['authUser'];

    return authUser?.sub;
  },
);
