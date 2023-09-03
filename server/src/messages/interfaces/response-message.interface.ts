export interface ResponseMessage {
  messageId: string;
  timestamp: Date;
  chatId: string;
  sender: string;
  receiver: string;
  text: string;
  seen: boolean;
}
