import {
  BlockedUserException,
  ChatDomainError,
  ConversationAlreadyExistsException,
  ConversationNotFoundException,
  TargetUserNotFoundException,
} from './chat.exceptions';

describe('ChatExceptions', () => {
  it('should instantiate ChatDomainError correctly', () => {
    const ex = new ChatDomainError('message');
    expect(ex.message).toBe('message');
    expect(ex.code).toBe('CHAT_DOMAIN_ERROR');
    expect(ex.type).toBe('BUSINESS_RULE');
  });

  it('should instantiate ConversationNotFoundException correctly', () => {
    const ex = new ConversationNotFoundException();
    expect(ex.message).toBe('Conversation not found');
    expect(ex.code).toBe('CHAT_CONVERSATION_NOT_FOUND');
  });

  it('should instantiate TargetUserNotFoundException correctly', () => {
    const ex = new TargetUserNotFoundException();
    expect(ex.message).toBe('Target user does not exist');
    expect(ex.code).toBe('CHAT_TARGET_USER_NOT_FOUND');
  });

  it('should instantiate BlockedUserException correctly', () => {
    const ex = new BlockedUserException();
    expect(ex.message).toBe('Cannot interact with blocked user');
    expect(ex.code).toBe('CHAT_BLOCKED_USER');
  });

  it('should instantiate ConversationAlreadyExistsException correctly', () => {
    const ex = new ConversationAlreadyExistsException();
    expect(ex.message).toBe('Conversation already exists');
    expect(ex.code).toBe('CHAT_CONVERSATION_ALREADY_EXISTS');
  });
});
