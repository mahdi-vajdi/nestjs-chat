import { MessageCreatedWsEventHandler } from './message-created.ws-handler';
import { MessageEditedWsEventHandler } from './message-edited.ws-handler';
import { MessageDeletedWsEventHandler } from './message-deleted.ws-handler';
import { UserBlockedWsEventHandler } from './user-blocked.ws-handler';
import { UserUnblockedWsEventHandler } from './user-unblocked.ws-handler';

export const EventHandlers = [
  MessageCreatedWsEventHandler,
  MessageEditedWsEventHandler,
  MessageDeletedWsEventHandler,
  UserBlockedWsEventHandler,
  UserUnblockedWsEventHandler,
];
