import { MessageCreatedWsEventHandler } from './message-created.ws-handler';
import { UserBlockedWsEventHandler } from './user-blocked.ws-handler';
import { UserUnblockedWsEventHandler } from './user-unblocked.ws-handler';

export const EventHandlers = [
  MessageCreatedWsEventHandler,
  UserBlockedWsEventHandler,
  UserUnblockedWsEventHandler,
];
