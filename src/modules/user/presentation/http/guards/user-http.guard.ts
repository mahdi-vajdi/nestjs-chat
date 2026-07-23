import { Injectable, Logger } from '@nestjs/common';
import { AuthIntegrationPort } from '@modules/user/application/ports/auth-integration.port';
import { BaseHttpAuthGuard } from '@common/guards/base-http-auth.guard';

@Injectable()
export class UserHttpGuard extends BaseHttpAuthGuard {
  protected readonly logger = new Logger(UserHttpGuard.name);

  constructor(private readonly authIntegrationPort: AuthIntegrationPort) {
    super();
  }

  protected verifyToken(token: string) {
    return this.authIntegrationPort.verifyToken(token);
  }
}
