import { ConversationType } from '@application/chat/enums/conversation-type.enum';
import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IMessageEntity } from '@application/chat/models/message.model';

export interface IConversation {
  title: string;
  picture: string;
  identifier: string;
  type: ConversationType;
  messages: Partial<IMessageEntity>;
}

export interface IConversationEntity
  extends IConversation,
    IIdentifiableEntity,
    IDatatableEntity,
    IDatatableEntity {}
