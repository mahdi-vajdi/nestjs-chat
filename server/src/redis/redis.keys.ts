export const redisUsersKey = (username: string) => `user:${username}`;

export const redisSocketChatUserKey = (chatId: string, username: string) =>
  `socket:chat:${chatId}:user:${username}`;
