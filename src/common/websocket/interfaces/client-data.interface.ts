import { Result } from '@common/result/result';

export interface ClientData {
  authUser?: any;
  accessToken?: string;
  authPromise?: Promise<Result<any>> | null;
}
