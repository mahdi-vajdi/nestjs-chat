export interface IBroadcastProvider {
  setServer(server: any): boolean;

  getServer(): any;
}

export const BROADCAST_PROVIDER = 'broadcast-providers';
