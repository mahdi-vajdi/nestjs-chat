
import { Result } from '@common/result/result';

export interface ValidatedTokenPayload {
  sub: string;
  role: string;
}

export abstract class AuthIntegrationPort {
  abstract verifyToken(token: string): Promise<Result<ValidatedTokenPayload>>;
}
