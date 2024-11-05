import { Module } from '@nestjs/common';
import { BROADCAST_PROVIDER } from '@infrastructure/websocket/broadcast/providers/broadcast.provider';
import { SocketIoBroadcast } from '@infrastructure/websocket/broadcast/socket-io/socket-io-broadcast';

@Module({
  providers: [
    {
      provide: BROADCAST_PROVIDER,
      useClass: SocketIoBroadcast,
    },
  ],
  exports: [BROADCAST_PROVIDER],
})
export class BroadcastModule {}
