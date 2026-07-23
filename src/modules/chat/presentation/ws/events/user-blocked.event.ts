import { BaseWsEvent } from '@common/websocket/base-ws-event';

export class UserBlockedData {
  blockerId: string;
  blockedId: string;
}

export class UserBlockedWsEvent extends BaseWsEvent<UserBlockedData> {
  get eventName(): string {
    return 'user.blocked';
  }
}
