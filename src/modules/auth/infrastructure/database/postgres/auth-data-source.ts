import { DataSource } from 'typeorm';
import { AppDataSource } from '@infrastructure/database/postgres/config/data-source';

export const AuthDataSource = new DataSource({
  ...AppDataSource.options,
  entities: ['dist/modules/auth/**/*.entity{.ts,.js}'],
  migrations: ['dist/modules/auth/infrastructure/database/migrations/**/*.js'],
});
