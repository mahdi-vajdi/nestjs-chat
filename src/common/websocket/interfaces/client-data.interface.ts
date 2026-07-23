export interface ClientData {
  authUser?: any;
  accessToken?: string;
  authPromise?: Promise<any> | null;
}
