import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ClientData } from '@presentation/ws/client-data.interface';

export const CurrentWsUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const clientData = context
      .switchToWs()
      .getClient<Socket<any, any, any, ClientData>>().data;
    const wsData = context.switchToWs().getData();
    return clientData.authUser || wsData['authUser'];
  },
);
