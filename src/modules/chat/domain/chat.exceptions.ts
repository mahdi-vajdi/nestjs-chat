import { DomainException } from '@common/exceptions/domain.exception';

export class TargetUserNotFoundException extends DomainException {
  constructor(reason?: string) {
    super(
      reason
        ? `Target user does not exist: ${reason}`
        : 'Target user does not exist',
      'CHAT_TARGET_USER_NOT_FOUND',
      'NOT_FOUND',
    );
  }
}

export class BlockedUserException extends DomainException {
  constructor(reason?: string) {
    super(
      reason
        ? `Cannot interact with blocked user: ${reason}`
        : 'Cannot interact with blocked user',
      'CHAT_BLOCKED_USER',
      'FORBIDDEN',
    );
  }
}

export class ConversationAlreadyExistsException extends DomainException {
  constructor(reason?: string) {
    super(
      reason
        ? `Conversation already exists: ${reason}`
        : 'Conversation already exists',
      'CHAT_CONVERSATION_ALREADY_EXISTS',
      'CONFLICT',
    );
  }
}

export class ConversationNotFoundException extends DomainException {
  constructor(reason?: string) {
    super(
      reason ? `Conversation not found: ${reason}` : 'Conversation not found',
      'CHAT_CONVERSATION_NOT_FOUND',
      'NOT_FOUND',
    );
  }
}

export class ChatDomainError extends DomainException {
  constructor(message: string) {
    super(message, 'CHAT_DOMAIN_ERROR', 'BUSINESS_RULE');
  }
}
