import { Test, TestingModule } from '@nestjs/testing';
import { AuthSaga } from './auth.saga';
import { SignupFailedEvent } from '@modules/auth/domain/events/signup-failed.event';
import { DeleteUserCommand } from '@modules/user/application/commands/delete-user/delete-user.command';
import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';

describe('AuthSaga', () => {
  let saga: AuthSaga;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthSaga],
    }).compile();

    saga = module.get<AuthSaga>(AuthSaga);
  });

  describe('signupFailed', () => {
    it('should map SignupFailedEvent to DeleteUserCommand', (done) => {
      const event = new SignupFailedEvent('user-1');
      const events$ = of(event, { type: 'OtherEvent' }); // Mix in another event to ensure filtering

      saga
        .signupFailed(events$)
        .pipe(toArray())
        .subscribe((commands) => {
          expect(commands).toHaveLength(1);
          expect(commands[0]).toBeInstanceOf(DeleteUserCommand);
          expect((commands[0] as DeleteUserCommand).id).toBe('user-1');
          done();
        });
    });
  });
});
