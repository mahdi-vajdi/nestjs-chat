export interface BroadcastProvider {
  setServer(server: any): boolean;

  getServer(): any;
}

export const BROADCAST_PROVIDER = 'broadcast-providers';
