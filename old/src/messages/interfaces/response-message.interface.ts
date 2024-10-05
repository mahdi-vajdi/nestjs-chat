export interface ResponseMessage {
  messageId: string;
  timestamp: Date;
  chatId: string;
  text: string;
  sender: string;
  receiver: string;
  seen: boolean;
}
