export class SocketMessage<T> {
  public data: T;
  public ack: (data: any) => void;
}
