interface IAuthDatabaseReader {}

interface IAuthDatabaseWriter {}

export interface IAuthDatabaseProvider
  extends IAuthDatabaseReader,
    IAuthDatabaseWriter {}

export const AUTH_DATABASE_PROVIDER = 'auth-database-provider';
