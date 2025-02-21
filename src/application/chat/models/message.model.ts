import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IConversationEntity } from '@chat/models/conversation.model';

export class IMessage {
  text: string;
  type: string;
  senderId: string;
  conversation: Partial<IConversationEntity>;
}

export interface IMessageEntity
  extends IMessage,
    IIdentifiableEntity,
    IDatatableEntity,
    IDatatableEntity {}
