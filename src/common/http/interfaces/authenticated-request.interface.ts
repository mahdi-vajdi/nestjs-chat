import { Request } from 'express';

export interface AuthenticatedRequest<T = any> extends Request {
  authUser: T;
  accessToken: string;
}
