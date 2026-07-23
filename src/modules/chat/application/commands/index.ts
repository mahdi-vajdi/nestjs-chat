import { CreateDirectConversationHandler } from './create-direct-conversation/create-direct-conversation.handler';
import { CreateMessageHandler } from './create-message/create-message.handler';
import { DeleteConversationHandler } from './delete-conversation/delete-conversation.handler';
import { MarkConversationAsReadCommandHandler } from './mark-conversation-as-read/mark-conversation-as-read.handler';

export const CommandHandlers = [
  CreateDirectConversationHandler,
  CreateMessageHandler,
  DeleteConversationHandler,
  MarkConversationAsReadCommandHandler,
];
