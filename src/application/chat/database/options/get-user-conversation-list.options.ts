import { ConversationType } from '@chat/enums/conversation-type.enum';
import { PaginationOptions } from '@common/pagination/pagination.interface';

export class GetUserConversationListOptions {
  type?: ConversationType;
  filterUserIds?: string[];
  withLastMessage?: boolean;
  pagination: PaginationOptions;
}
