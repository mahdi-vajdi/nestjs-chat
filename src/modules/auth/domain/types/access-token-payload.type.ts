export type AccessTokenPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
};
