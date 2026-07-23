import { GetUserIdsByNameOrUsernameHandler } from './get-user-ids-by-name-or-username/get-user-ids-by-name-or-username.handler';
import { GetUserByIdHandler } from './get-user-by-id/get-user-by-id.handler';
import { GetUsersByIdsHandler } from './get-users-by-ids/get-users-by-ids.handler';
import { ValidatePasswordHandler } from './validate-password/validate-password.handler';
import { GetBlockStatusHandler } from './get-block-status/get-block-status.handler';
import { GetBlockedUsersIdsHandler } from './get-blocked-users-ids/get-blocked-users-ids.handler';

export const QueryHandlers = [
  GetUserIdsByNameOrUsernameHandler,
  GetUserByIdHandler,
  GetUsersByIdsHandler,
  ValidatePasswordHandler,
  GetBlockStatusHandler,
  GetBlockedUsersIdsHandler,
];
