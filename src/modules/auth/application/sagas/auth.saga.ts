import { Injectable, Logger } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SignupFailedEvent } from '@modules/auth/domain/events/signup-failed.event';
import { DeleteUserCommand } from '@modules/user/application/commands/delete-user/delete-user.command';

@Injectable()
export class AuthSaga {
  private readonly logger = new Logger(AuthSaga.name);

  @Saga()
  signupFailed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(SignupFailedEvent),
      map((event) => {
        this.logger.log(
          `SignupFailedEvent received for user ${event.userId}. Triggering rollback...`,
        );
        return new DeleteUserCommand(event.userId);
      }),
    );
  };
}
