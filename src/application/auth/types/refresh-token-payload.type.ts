export type RefreshTokenPayload = {
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  jti: string;
};
