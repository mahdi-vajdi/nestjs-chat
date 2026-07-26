import { MessageEntity } from './message.entity';
import { MessageType } from '../enums/chat-type.enum';

describe('MessageEntity', () => {
  it('should create correctly', () => {
    const msg = MessageEntity.create('test', MessageType.TEXT, 'u-1', 'c-1', [
      'u-2',
    ]);
    expect(msg.id).toBeDefined();
    expect(msg.text).toBe('test');
    expect(msg.type).toBe(MessageType.TEXT);
    expect(msg.senderId).toBe('u-1');
    expect(msg.conversationId).toBe('c-1');
    expect(msg.deletedForUserIds).toEqual(['u-2']);
  });

  it('should reconstruct correctly', () => {
    const date = new Date();
    const msg = MessageEntity.reconstruct(
      'm-1',
      'test',
      MessageType.TEXT,
      'u-1',
      'c-1',
      ['u-3'],
      date,
      date,
      date,
    );
    expect(msg.id).toBe('m-1');
    expect(msg.deletedForUserIds).toEqual(['u-3']);
  });

  it('should soft delete and restore', () => {
    const msg = MessageEntity.create('test', MessageType.TEXT, 'u-1', 'c-1');
    msg.softDelete();
    expect(msg.deletedAt).toBeDefined();
    msg.restore();
    expect(msg.deletedAt).toBeUndefined();
  });

  it('should delete for user', () => {
    const msg = MessageEntity.create('test', MessageType.TEXT, 'u-1', 'c-1');
    msg.deleteForUser('u-2');
    expect(msg.deletedForUserIds).toContain('u-2');
  });

  it('should verify properties', () => {
    const msg = MessageEntity.create('test', MessageType.TEXT, 'u-1', 'c-1');
    expect(msg.text).toBe('test');

    msg.softDelete();
    expect(msg.deletedAt).toBeDefined();
  });
});
