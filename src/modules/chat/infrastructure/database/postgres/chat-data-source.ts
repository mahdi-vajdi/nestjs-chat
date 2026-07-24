import { DataSource } from 'typeorm';
import { AppDataSource } from '@infrastructure/database/postgres/config/data-source';

export const ChatDataSource = new DataSource({
  ...AppDataSource.options,
  entities: ['dist/modules/chat/**/*.entity{.ts,.js}'],
  migrations: ['dist/modules/chat/infrastructure/database/migrations/**/*.js'],
});
