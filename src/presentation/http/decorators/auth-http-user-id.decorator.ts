import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload } from '@auth/types/access-token-payload.type';

export const AuthHttpUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const authUser: AccessTokenPayload = request['authUser'];

    return authUser.sub;
  },
);
