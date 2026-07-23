import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class UserUnblockedData {
  blockerId: string;
  blockedId: string;
}

export class UserUnblockedWsEvent extends BaseWsEvent<UserUnblockedData> {
  get eventName(): string {
    return 'user.unblocked';
  }
}
