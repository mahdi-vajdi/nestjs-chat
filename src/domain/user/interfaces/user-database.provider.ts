interface IUserDatabaseReader {}

interface IUserDatabaseWriter {}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-provider';
