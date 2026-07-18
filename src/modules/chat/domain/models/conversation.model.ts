import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { MessageEntity } from '@chat/domain/models/message.entity';
import { ConversationType } from '@chat/domain/enums/conversation-type.enum';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';
import { v7 as uuidv7 } from 'uuid';

import { AggregateRoot } from '@common/domain/aggregate-root';

export class ConversationEntity
  extends AggregateRoot<string>
  implements SoftDeletableEntity
{
  private _title: string | null;
  private _picture: string | null;
  private _identifier: string | null;
  private _type: ConversationType;
  private _deletedAt?: Date;

  // Domain associations
  public members: ConversationMemberEntity[] = [];
  public messages: MessageEntity[] = [];
  public lastMessage?: MessageEntity;

  private constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    type: ConversationType,
    title: string | null = null,
    picture: string | null = null,
    identifier: string | null = null,
    deletedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._type = type;
    this._title = title;
    this._picture = picture;
    this._identifier = identifier;
    this._deletedAt = deletedAt;
  }

  public static createDirect(
    userId: string,
    targetUserId: string,
  ): ConversationEntity {
    const id = uuidv7();
    const conversation = new ConversationEntity(
      id,
      new Date(),
      new Date(),
      ConversationType.DIRECT,
      null,
      null,
      uuidv7(),
    );

    conversation.members = [
      ConversationMemberEntity.create(userId, id),
      ConversationMemberEntity.create(targetUserId, id),
    ];

    // TODO: Apply ConversationCreatedEvent here

    return conversation;
  }

  public static reconstruct(
    id: string,
    type: ConversationType,
    title: string | null,
    picture: string | null,
    identifier: string | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt?: Date,
  ): ConversationEntity {
    return new ConversationEntity(
      id,
      createdAt,
      updatedAt,
      type,
      title,
      picture,
      identifier,
      deletedAt,
    );
  }

  public get type(): ConversationType {
    return this._type;
  }
  public get title(): string | null {
    return this._title;
  }
  public get picture(): string | null {
    return this._picture;
  }
  public get identifier(): string | null {
    return this._identifier;
  }
  public get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  public markAsRead(userId: string, messageId: string): void {
    const member = this.members.find((m) => m.userId === userId);
    if (member) {
      member.updateLastSeenMessage(messageId);
    }
  }

  public softDelete(): void {
    this._deletedAt = new Date();
    this.updatedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
