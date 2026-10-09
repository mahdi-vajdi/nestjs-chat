import { MessageEntity } from './message.entity';
import { MessageType } from '../enums/chat-type.enum';
import {
  ChatDomainError,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '../chat.exceptions';
import { MessageEditedDomainEvent } from '../events/message-edited.domain-event';
import { MessageDeletedDomainEvent } from '../events/message-deleted.domain-event';
import { MessageDeleteScope } from '../enums/message-delete-scope.enum';

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
    message.deleteForEveryone(memberId, 'user-1');

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

  describe('deleteForUser', () => {
    it('should add userId to deletedForUserIds and emit MessageDeletedDomainEvent with ME scope', () => {
      const message = MessageEntity.create(
        'Some text',
        MessageType.TEXT,
        memberId,
        conversationId,
      );
      message.uncommit();

      message.deleteForUser('user-1');

      expect(message.deletedForUserIds).toContain('user-1');
      const events = message.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MessageDeletedDomainEvent);
      const event = events[0] as MessageDeletedDomainEvent;
      expect(event.scope).toBe(MessageDeleteScope.ME);
      expect(event.actorUserId).toBe('user-1');
      expect(event.deletedForUserIds).toEqual(['user-1']);
    });

    it('should be a no-op and emit no events when user has already deleted the message', () => {
      const message = MessageEntity.create(
        'Some text',
        MessageType.TEXT,
        memberId,
        conversationId,
        ['user-1'],
      );
      message.uncommit();

      message.deleteForUser('user-1');

      expect(message.deletedForUserIds).toEqual(['user-1']);
      expect(message.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('deleteForEveryone', () => {
    it('should set deletedAt, retain text, and emit MessageDeletedDomainEvent with EVERYONE scope', () => {
      const message = MessageEntity.create(
        'Important text',
        MessageType.TEXT,
        memberId,
        conversationId,
      );
      message.uncommit();

      message.deleteForEveryone(memberId, 'user-1');

      expect(message.deletedAt).toBeInstanceOf(Date);
      expect(message.text).toBe('Important text'); // Retained in DB for analysis
      const events = message.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MessageDeletedDomainEvent);
      const event = events[0] as MessageDeletedDomainEvent;
      expect(event.scope).toBe(MessageDeleteScope.EVERYONE);
      expect(event.actorUserId).toBe('user-1');
      expect(event.deletedAt).toEqual(message.deletedAt);
    });

    it('should throw NotMessageOwnerException when non-sender tries to delete for everyone', () => {
      const message = MessageEntity.create(
        'Some text',
        MessageType.TEXT,
        memberId,
        conversationId,
      );

      expect(() => {
        message.deleteForEveryone('other-member', 'user-2');
      }).toThrow(NotMessageOwnerException);
    });

    it('should be a no-op when already deleted for everyone', () => {
      const message = MessageEntity.create(
        'Some text',
        MessageType.TEXT,
        memberId,
        conversationId,
      );
      message.deleteForEveryone(memberId, 'user-1');
      message.uncommit();

      message.deleteForEveryone(memberId, 'user-1');

      expect(message.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('loadDeletedForUserId', () => {
    it('should add userId without emitting domain events', () => {
      const message = MessageEntity.create(
        'Some text',
        MessageType.TEXT,
        memberId,
        conversationId,
      );
      message.uncommit();

      message.loadDeletedForUserId('user-1');

      expect(message.deletedForUserIds).toContain('user-1');
      expect(message.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
