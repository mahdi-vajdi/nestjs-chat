interface createChatTypes {
  handleClose: Function;
}

interface chatItemType {
  chatId: string;
  createdAt: string;
  user1: string;
  user2: string;
}

export type { createChatTypes, chatItemType };
