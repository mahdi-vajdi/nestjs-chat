export const redisUsersKey = (username: string) => `user:${username}`;

export const redisChatKey = (chatId: string) => `chat:${chatId}`;

export const redisSocketChatUserKey = (chatId: string, username: string) =>
  `socket:chat:${chatId}:user:${username}`;
