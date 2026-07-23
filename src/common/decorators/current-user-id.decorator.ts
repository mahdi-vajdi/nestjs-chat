import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Socket } from 'socket.io';
import { ClientData } from '@common/websocket/interfaces/client-data.interface';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const authUser = request['authUser'] as { sub: string } | undefined;
      return authUser?.sub;
    } else if (context.getType() === 'ws') {
      const clientData = context
        .switchToWs()
        .getClient<Socket<any, any, any, ClientData>>().data;
      const wsData = context.switchToWs().getData();
      const authUser = clientData?.authUser || wsData?.['authUser'];
      return authUser?.sub;
    }

    return undefined;
  },
);
