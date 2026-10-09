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
import { io, Socket } from 'socket.io-client';

describe('ChatWsGateway (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let postgresContainer: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let user1Token: string;
  let user2Token: string;
  let user2Id: string;
  let clientSocket1: Socket;
  let clientSocket2: Socket;

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

    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new GlobalHttpExceptionFilter(httpAdapterHost));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    dataSource = app.get<DataSource>(getDataSourceToken(DatabaseType.POSTGRES));
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "auth";');
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "user";');
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "chat";');
    await dataSource.synchronize(true);

    await app.listen(0); // Listen on random port
  }, 60000);

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  beforeEach(async () => {
    // Clear the database after each test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      const schema = entity.schema ? `"${entity.schema}".` : '';
      await repository.query(
        `TRUNCATE TABLE ${schema}"${entity.tableName}" CASCADE;`,
      );
    }

    // Create user 1
    let res = await request(app.getHttpServer()).post('/v1/auth/signup').send({
      email: 'u1@test.com',
      username: 'u1',
      password: 'Password123!',
      firstName: 'U',
      lastName: '1',
    });
    user1Token = res.body.accessToken; // Create user 2
    res = await request(app.getHttpServer()).post('/v1/auth/signup').send({
      email: 'u2@test.com',
      username: 'u2',
      password: 'Password123!',
      firstName: 'U',
      lastName: '2',
    });
    user2Token = res.body.accessToken;
    user2Id = res.body.id;

    const httpServer = app.getHttpServer();
    const address = httpServer.address();
    const url = `http://localhost:${address.port}`;

    clientSocket1 = io(`${url}/chat`, {
      extraHeaders: { Authorization: `Bearer ${user1Token}` },
      autoConnect: false,
    });

    clientSocket2 = io(`${url}/chat`, {
      extraHeaders: { Authorization: `Bearer ${user2Token}` },
      autoConnect: false,
    });

    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.on('ready', resolve);
        clientSocket1.connect();
      }),
      new Promise<void>((resolve) => {
        clientSocket2.on('ready', resolve);
        clientSocket2.connect();
      }),
    ]);
  });

  afterEach(() => {
    clientSocket1.disconnect();
    clientSocket2.disconnect();
  });

  it('should create a conversation and send a message', (done) => {
    clientSocket2.on('conversation.created', (data) => {
      expect(data.name).toBe('U 1');
      expect(data.lastMessage.content).toBe('Hello User 2');
      done();
    });

    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'Hello User 2' },
      (res: any) => {
        expect(res.name).toBe('U 2');
        expect(res.chat.content).toBe('Hello User 2');
      },
    );
  });

  it('should list conversations', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'Hey' },
      () => {
        clientSocket1.emit(
          'conversation.list',
          { page: 1, pageSize: 15 },
          (res: any) => {
            expect(res.data.length).toBe(1);
            expect(res.data[0].lastMessage.text).toBe('Hey');
            done();
          },
        );
      },
    );
  });

  it('should send a message in an existing conversation', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'First' },
      (createRes: any) => {
        const convId = createRes.id;

        clientSocket2.on('conversation.message.sent', (msg) => {
          if (msg.content === 'First') return;
          expect(msg.content).toBe('Second message');
          done();
        });

        clientSocket1.emit(
          'conversation.message.send',
          { conversationId: convId, text: 'Second message' },
          (res: any) => {
            expect(res.content).toBe('Second message');
          },
        );
      },
    );
  });

  it('should list messages in a conversation', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'First' },
      (createRes: any) => {
        const convId = createRes.id;

        clientSocket1.emit(
          'conversation.message.send',
          { conversationId: convId, text: 'Second' },
          () => {
            clientSocket1.emit(
              'conversation.message.list',
              { conversationId: convId, page: 1, pageSize: 15 },
              (res: any) => {
                expect(res.messages.list.length).toBe(2);
                done();
              },
            );
          },
        );
      },
    );
  });

  it('should mark message as seen', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'Hello' },
      (createRes: any) => {
        const convId = createRes.id;
        const msgId = createRes.chat.id;

        clientSocket1.on('conversation.message.seen', (data) => {
          expect(data.messageId).toBe(msgId);
          done();
        });

        clientSocket2.emit('conversation.message.markSeen', {
          conversationId: convId,
          messageId: msgId,
        });
      },
    );
  });

  it('should edit a message and broadcast conversation.message.edited', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'Original message' },
      (createRes: any) => {
        const convId = createRes.id;
        const msgId = createRes.chat.id;

        clientSocket2.on('conversation.message.edited', (data) => {
          expect(data.id).toBe(msgId);
          expect(data.conversationId).toBe(convId);
          expect(data.content).toBe('Updated message text');
          expect(data.editedAt).toBeDefined();

          // Verify conversation.message.list includes editedAt
          clientSocket1.emit(
            'conversation.message.list',
            { conversationId: convId, page: 1, pageSize: 10 },
            (listRes: any) => {
              expect(listRes.messages.list.length).toBe(1);
              expect(listRes.messages.list[0].id).toBe(msgId);
              expect(listRes.messages.list[0].content).toBe(
                'Updated message text',
              );
              expect(listRes.messages.list[0].editedAt).toBeDefined();
              done();
            },
          );
        });

        clientSocket1.emit(
          'conversation.message.edit',
          {
            conversationId: convId,
            messageId: msgId,
            text: 'Updated message text',
          },
          (editAck: any) => {
            expect(editAck.id).toBe(msgId);
            expect(editAck.content).toBe('Updated message text');
            expect(editAck.editedAt).toBeDefined();
          },
        );
      },
    );
  });

  it('should reject editing a message when user is not the owner', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'User 1 message' },
      (createRes: any) => {
        const convId = createRes.id;
        const msgId = createRes.chat.id;

        // User 2 attempts to edit User 1's message
        clientSocket2.emit(
          'conversation.message.edit',
          {
            conversationId: convId,
            messageId: msgId,
            text: 'Malicious update',
          },
          (errRes: any) => {
            expect(errRes.statusCode).toBe(403);
            expect(errRes.code).toBe('CHAT_NOT_MESSAGE_OWNER');
            done();
          },
        );
      },
    );
  });

  it('should delete a message for me without affecting the recipient', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'Message for me delete test' },
      (createRes: any) => {
        const convId = createRes.id;
        const msgId = createRes.chat.id;

        // User 1 listens for deleted sync event on their socket
        clientSocket1.once('conversation.message.deleted', (data) => {
          expect(data.id).toBe(msgId);
          expect(data.conversationId).toBe(convId);
          expect(data.scope).toBe('ME');

          // Check that User 1 no longer sees the message
          clientSocket1.emit(
            'conversation.message.list',
            { conversationId: convId, page: 1, pageSize: 10 },
            (list1Res: any) => {
              expect(
                list1Res.messages.list.find((m: any) => m.id === msgId),
              ).toBeUndefined();

              // Check that User 2 STILL sees the message
              clientSocket2.emit(
                'conversation.message.list',
                { conversationId: convId, page: 1, pageSize: 10 },
                (list2Res: any) => {
                  const u2Msg = list2Res.messages.list.find(
                    (m: any) => m.id === msgId,
                  );
                  expect(u2Msg).toBeDefined();
                  expect(u2Msg.content).toBe('Message for me delete test');
                  done();
                },
              );
            },
          );
        });

        // User 1 deletes for ME
        clientSocket1.emit(
          'conversation.message.delete',
          {
            conversationId: convId,
            messageId: msgId,
            scope: 'ME',
          },
          (delAck: any) => {
            expect(delAck.id).toBe(msgId);
            expect(delAck.scope).toBe('ME');
          },
        );
      },
    );
  });

  it('should delete a message for everyone, broadcast event, and tombstone the message', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'Confidential message' },
      (createRes: any) => {
        const convId = createRes.id;
        const msgId = createRes.chat.id;

        // Recipient (User 2) listens for deleted event
        clientSocket2.once('conversation.message.deleted', (data) => {
          expect(data.id).toBe(msgId);
          expect(data.conversationId).toBe(convId);
          expect(data.scope).toBe('EVERYONE');
          expect(data.deletedAt).toBeDefined();

          // User 2 fetches message list: text must be masked (null) and deletedAt set
          clientSocket2.emit(
            'conversation.message.list',
            { conversationId: convId, page: 1, pageSize: 10 },
            (listRes: any) => {
              const msg = listRes.messages.list.find(
                (m: any) => m.id === msgId,
              );
              expect(msg).toBeDefined();
              expect(msg.content).toBeNull(); // Text is masked at read boundary!
              expect(msg.deletedAt).toBeDefined();
              done();
            },
          );
        });

        // User 1 deletes for EVERYONE
        clientSocket1.emit(
          'conversation.message.delete',
          {
            conversationId: convId,
            messageId: msgId,
            scope: 'EVERYONE',
          },
          (delAck: any) => {
            expect(delAck.id).toBe(msgId);
            expect(delAck.scope).toBe('EVERYONE');
          },
        );
      },
    );
  });

  it('should reject deleting a message for everyone when user is not the owner', (done) => {
    clientSocket1.emit(
      'conversation.create',
      { targetUserId: user2Id, content: 'User 1 message' },
      (createRes: any) => {
        const convId = createRes.id;
        const msgId = createRes.chat.id;

        // User 2 attempts to delete User 1's message for everyone
        clientSocket2.emit(
          'conversation.message.delete',
          {
            conversationId: convId,
            messageId: msgId,
            scope: 'EVERYONE',
          },
          (errRes: any) => {
            expect(errRes.statusCode).toBe(403);
            expect(errRes.code).toBe('CHAT_NOT_MESSAGE_OWNER');
            done();
          },
        );
      },
    );
  });
});
