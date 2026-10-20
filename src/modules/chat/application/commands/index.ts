import { CreateDirectConversationHandler } from './create-direct-conversation/create-direct-conversation.handler';
import { CreateMessageHandler } from './create-message/create-message.handler';
import { DeleteConversationHandler } from './delete-conversation/delete-conversation.handler';
import { DeleteMessageHandler } from './delete-message/delete-message.handler';
import { EditMessageHandler } from './edit-message/edit-message.handler';
import { MarkConversationAsReadCommandHandler } from './mark-conversation-as-read/mark-conversation-as-read.handler';

export const CommandHandlers = [
  CreateDirectConversationHandler,
  CreateMessageHandler,
  EditMessageHandler,
  DeleteMessageHandler,
  DeleteConversationHandler,
  MarkConversationAsReadCommandHandler,
];

export * from './create-direct-conversation/create-direct-conversation.command';
export * from './create-message/create-message.command';
export * from './edit-message/edit-message.command';
export * from './delete-message/delete-message.command';
export * from './delete-conversation/delete-conversation.command';
export * from './mark-conversation-as-read/mark-conversation-as-read.command';
