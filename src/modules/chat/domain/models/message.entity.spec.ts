import { MessageEntity } from './message.entity';
import { MessageType } from '../enums/chat-type.enum';
import {
  ChatDomainError,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '../chat.exceptions';
import { MessageEditedDomainEvent } from '../events/message-edited.domain-event';

describe('MessageEntity', () => {
  const memberId = 'member-123';
  const conversationId = 'conv-456';

  it('should successfully edit message text and emit MessageEditedDomainEvent', () => {
    const message = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      conversationId,
    );

    // Clear events from creation
    message.uncommit();

    message.edit('Updated text', memberId);

    expect(message.text).toBe('Updated text');
    expect(message.editedAt).toBeInstanceOf(Date);
    expect(message.updatedAt).toBeInstanceOf(Date);

    const events = message.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MessageEditedDomainEvent);

    const editEvent = events[0] as MessageEditedDomainEvent;
    expect(editEvent.messageId).toBe(message.id);
    expect(editEvent.conversationId).toBe(conversationId);
    expect(editEvent.senderId).toBe(memberId);
    expect(editEvent.text).toBe('Updated text');
    expect(editEvent.editedAt).toEqual(message.editedAt);
  });

  it('should throw NotMessageOwnerException when edited by someone other than the sender', () => {
    const message = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      conversationId,
    );

    expect(() => {
      message.edit('Malicious edit', 'different-member');
    }).toThrow(NotMessageOwnerException);
  });

  it('should throw MessageNotFoundException when editing a deleted message', () => {
    const message = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      conversationId,
    );
    message.softDelete();

    expect(() => {
      message.edit('New text', memberId);
    }).toThrow(MessageNotFoundException);
  });

  it('should throw ChatDomainError when new text is empty or only whitespace', () => {
    const message = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      conversationId,
    );

    expect(() => {
      message.edit('', memberId);
    }).toThrow(ChatDomainError);

    expect(() => {
      message.edit('   ', memberId);
    }).toThrow(ChatDomainError);
  });

  it('should be a no-op and emit no events when new text is identical to current text', () => {
    const message = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      conversationId,
    );
    message.uncommit(); // drain creation event

    message.edit('Initial text', memberId);

    expect(message.editedAt).toBeUndefined();
    expect(message.getUncommittedEvents()).toHaveLength(0);
  });

  it('should throw ChatDomainError when trying to edit non-TEXT message', () => {
    const message = MessageEntity.reconstruct(
      'msg-id',
      'media url',
      'IMAGE' as MessageType,
      memberId,
      conversationId,
      [],
      new Date(),
      new Date(),
    );

    expect(() => {
      message.edit('Updated caption', memberId);
    }).toThrow(ChatDomainError);
  });
});
