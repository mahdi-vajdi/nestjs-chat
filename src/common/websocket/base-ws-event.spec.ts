import { BaseWsEvent } from './base-ws-event';

class TestWsEvent extends BaseWsEvent<{ key: string }> {
  get eventName() {
    return 'test.event';
  }
}

describe('BaseWsEvent', () => {
  it('should initialize data correctly', () => {
    const payload = { key: 'value' };
    const event = new TestWsEvent(payload);
    expect(event.data).toEqual(payload);
    expect(event.eventName).toEqual('test.event');
  });
});
