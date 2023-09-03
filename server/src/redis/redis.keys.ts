export const redisUserSocketIdKey = (username: string) =>
  `socket:user:${username}`;

export const redisSocketChatUserKey = (chatId: string, username: string) =>
  `socket:chat:${chatId}:user:${username}`;
