import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { HttpAdapterHost } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from '@common/http/filters/global-http-exception.filter';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let postgresContainer: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let accessToken: string;
  let targetUserId: string;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('chatterbox_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    process.env.POSTGRES_HOST = postgresContainer.getHost();
    process.env.POSTGRES_PORT = postgresContainer.getPort().toString();
    process.env.POSTGRES_USERNAME = postgresContainer.getUsername();
    process.env.POSTGRES_PASSWORD = postgresContainer.getPassword();
    process.env.POSTGRES_DATABASE = postgresContainer.getDatabase();
    process.env.POSTGRES_LOG = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    dataSource = app.get<DataSource>(getDataSourceToken(DatabaseType.POSTGRES));
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "auth";');
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "user";');
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "chat";');
    await dataSource.synchronize(true);

    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new GlobalHttpExceptionFilter(httpAdapterHost));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  afterEach(async () => {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      const schema = entity.schema ? `"${entity.schema}".` : '';
      await repository.query(
        `TRUNCATE TABLE ${schema}"${entity.tableName}" CASCADE;`,
      );
    }
  });

  beforeEach(async () => {
    // Create user1
    const res1 = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        email: 'user1@test.com',
        username: 'user1',
        password: 'Password123!',
        firstName: 'User',
        lastName: 'One',
      })
      .expect(201);
    accessToken = res1.body.accessToken;

    // Create user2
    const res2 = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        email: 'user2@test.com',
        username: 'user2',
        password: 'Password123!',
        firstName: 'User',
        lastName: 'Two',
      })
      .expect(201);
    targetUserId = res2.body.id;
  });

  it('/user/block (POST) - block a user successfully', async () => {
    await request(app.getHttpServer())
      .post('/user/block')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetUserId })
      .expect(201); // NestJS defaults to 201 for POST
  });

  it('/user/block (POST) - fail to block an already blocked user', async () => {
    await request(app.getHttpServer())
      .post('/user/block')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetUserId })
      .expect(201);

    await request(app.getHttpServer())
      .post('/user/block')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetUserId })
      .expect(409); // Conflict
  });

  it('/user/block/:targetUserId (DELETE) - unblock a blocked user', async () => {
    await request(app.getHttpServer())
      .post('/user/block')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetUserId })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/user/block/${targetUserId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200); // NestJS defaults to 200 for DELETE
  });
});
