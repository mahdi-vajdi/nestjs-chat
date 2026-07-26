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

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let postgresContainer: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Spin up Postgres using Testcontainers
    postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('chatterbox_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    // Override environment variables for TypeORM to connect to the container
    process.env.POSTGRES_HOST = postgresContainer.getHost();
    process.env.POSTGRES_PORT = postgresContainer.getPort().toString();
    process.env.POSTGRES_USERNAME = postgresContainer.getUsername();
    process.env.POSTGRES_PASSWORD = postgresContainer.getPassword();
    process.env.POSTGRES_DATABASE = postgresContainer.getDatabase();

    // Disable logging for cleaner test output
    process.env.POSTGRES_LOG = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Sync database schema
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
  }, 60000); // 60s timeout for downloading postgres image

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  afterEach(async () => {
    // Clear the database after each test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      const schema = entity.schema ? `"${entity.schema}".` : '';
      await repository.query(
        `TRUNCATE TABLE ${schema}"${entity.tableName}" CASCADE;`,
      );
    }
  });

  it('/v1/auth/signup (POST) - success', async () => {
    const signupPayload = {
      email: 'e2e@test.com',
      username: 'e2e',
      password: 'Password123!',
      firstName: 'E2E',
      lastName: 'Test',
    };

    const res = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send(signupPayload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('/v1/auth/signup (POST) - duplicate email', async () => {
    const signupPayload = {
      email: 'e2e@test.com',
      username: 'e2e',
      password: 'Password123!',
      firstName: 'E2E',
      lastName: 'Test',
    };

    await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send(signupPayload)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send(signupPayload)
      .expect(409); // Conflict

    expect(res.body.message).toBe(
      'User already exists: Your email is Duplicate',
    );
  });

  it('/v1/auth/signin (POST) - success', async () => {
    const signupPayload = {
      email: 'e2e2@test.com',
      username: 'e2e2',
      password: 'Password123!',
      firstName: 'E2E',
      lastName: 'Test',
    };

    await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send(signupPayload)
      .expect(201);

    const signinPayload = {
      identifier: 'e2e2@test.com',
      password: 'Password123!',
    };

    const res = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send(signinPayload)
      .expect(201);

    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.firstName).toBe('E2E');
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it('/v1/auth/signin (POST) - invalid credentials', async () => {
    const signinPayload = {
      identifier: 'nonexistent@test.com',
      password: 'WrongPassword123!',
    };

    await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send(signinPayload)
      .expect(401);
  });
});
