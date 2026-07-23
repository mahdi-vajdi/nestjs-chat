export interface ValidatedTokenPayload {
  sub: string;
  role: string;
  exp?: number;
}

export abstract class AuthIntegrationPort {
  abstract verifyToken(token: string): Promise<ValidatedTokenPayload>;
}
