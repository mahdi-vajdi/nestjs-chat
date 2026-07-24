import { DataSource } from 'typeorm';
import { AppDataSource } from '@infrastructure/database/postgres/config/data-source';

export const UserDataSource = new DataSource({
  ...AppDataSource.options,
  entities: ['dist/modules/user/**/*.entity{.ts,.js}'],
  migrations: ['dist/modules/user/infrastructure/database/migrations/**/*.js'],
});
