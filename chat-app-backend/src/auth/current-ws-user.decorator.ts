import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentWsUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToWs().getClient().user,
);
