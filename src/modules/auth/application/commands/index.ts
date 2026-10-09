import { SignupHandler } from './signup/signup.handler';
import { SigninHandler } from './signin/signin.handler';
import { RefreshTokensHandler } from './refresh-tokens/refresh-tokens.handler';
import { LogoutHandler } from './logout/logout.handler';

export const CommandHandlers = [
  SignupHandler,
  SigninHandler,
  RefreshTokensHandler,
  LogoutHandler,
];
