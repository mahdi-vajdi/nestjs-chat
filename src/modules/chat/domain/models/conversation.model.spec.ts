import { ConversationEntity } from './conversation.model';
import { ConversationType } from '../enums/conversation-type.enum';
import { ConversationMemberEntity } from './conversation-member.model';
import { MessageEntity } from './message.entity';
import { MessageType } from '../enums/chat-type.enum';

describe('ConversationEntity', () => {
  it('should create direct correctly and add members', () => {
    const conv = ConversationEntity.createDirect('u-1', 'u-2');
    expect(conv.id).toBeDefined();
    expect(conv.type).toBe(ConversationType.DIRECT);
    expect(conv.members).toHaveLength(2);
    expect(conv.members[0].userId).toBe('u-1');
    expect(conv.members[1].userId).toBe('u-2');
  });

  it('should reconstruct correctly', () => {
    const date = new Date();
    const conv = ConversationEntity.reconstruct(
      'c-1',
      ConversationType.DIRECT,
      'title',
      'pic',
      'ident',
      date,
      date,
    );
    expect(conv.id).toBe('c-1');
    expect(conv.type).toBe(ConversationType.DIRECT);
    expect(conv.title).toBe('title');
    expect(conv.picture).toBe('pic');
    expect(conv.identifier).toBe('ident');
  });

  it('should not add more than 2 members to direct conversation', () => {
    const conv = ConversationEntity.createDirect('u-1', 'u-2');
    expect(() =>
      conv.addMember(ConversationMemberEntity.create('u-3', conv.id)),
    ).toThrow('Direct conversations can only have 2 members');
  });

  it('should not add duplicate members', () => {
    const conv = ConversationEntity.reconstruct(
      'c-1',
      ConversationType.DIRECT,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );
    const member = ConversationMemberEntity.create('u-1', conv.id);
    conv.addMember(member);
    conv.addMember(member);
    expect(conv.members).toHaveLength(1);
  });

  it('should add message and update lastMessage', () => {
    const conv = ConversationEntity.createDirect('u-1', 'u-2');
    const msg = MessageEntity.create('test', MessageType.TEXT, 'u-1', conv.id);
    conv.addMessage(msg);
    expect(conv.messages).toHaveLength(1);
    expect(conv.lastMessage).toBe(msg);
  });

  it('should load properties correctly', () => {
    const conv = ConversationEntity.createDirect('u-1', 'u-2');
    const msg = MessageEntity.create('test', MessageType.TEXT, 'u-1', conv.id);
    conv.loadMembers([]);
    expect(conv.members).toHaveLength(0);
    conv.loadMessages([msg]);
    expect(conv.messages).toHaveLength(1);
    conv.loadLastMessage(msg);
    expect(conv.lastMessage).toBe(msg);
  });

  it('should mark as read', () => {
    const conv = ConversationEntity.createDirect('u-1', 'u-2');
    conv.markAsRead('u-1', 'msg-1');
    expect(
      conv.members.find((m) => m.userId === 'u-1')?.lastSeenMessageId,
    ).toBe('msg-1');
  });

  it('should soft delete and restore', () => {
    const conv = ConversationEntity.createDirect('u-1', 'u-2');
    conv.softDelete();
    expect(conv.deletedAt).toBeDefined();
    conv.restore();
    expect(conv.deletedAt).toBeUndefined();
  });
});
