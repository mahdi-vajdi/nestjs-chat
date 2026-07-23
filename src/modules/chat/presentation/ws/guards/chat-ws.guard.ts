import { Injectable, Logger } from '@nestjs/common';
import { AuthIntegrationPort } from '@modules/chat/application/ports/auth-integration.port';
import { BaseWsAuthGuard } from '@common/guards/base-ws-auth.guard';

@Injectable()
export class ChatWsGuard extends BaseWsAuthGuard {
  protected readonly logger = new Logger(ChatWsGuard.name);

  constructor(private readonly authIntegrationPort: AuthIntegrationPort) {
    super();
  }

  protected verifyToken(token: string) {
    return this.authIntegrationPort.verifyToken(token);
  }
}
