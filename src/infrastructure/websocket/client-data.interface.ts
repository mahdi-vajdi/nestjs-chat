import { AccessTokenPayload } from '@auth/domain/types/access-token-payload.type';
import { Result } from '@common/result/result';

export interface ClientData {
  authUser?: AccessTokenPayload;
  accessToken?: string;
  authPromise?: Promise<Result<AccessTokenPayload>> | null;
}
