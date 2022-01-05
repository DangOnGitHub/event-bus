/* eslint-disable no-unused-vars */
import { EventBus } from '../rabbitmq/event-bus.js';
import { Connection } from '../rabbitmq/connection.js';
import assert from 'assert';

class Channel {
  assertExchange(exchange, type) {}
  publish(exchange, routingKey, content, options) {}
  assertQueue(queue) {}
  bindQueue(queue, exchange, routingKey) {}
  consume(queue, handler) {}
  ack(message) {}
}

let eventBus;
let connection;
let channel;
beforeEach(() => {
  connection = td.instance(Connection);
  channel = td.instance(Channel);
  td.when(connection.createModel()).thenReturn(channel);
  eventBus = new EventBus(logger, connection, 'my_queue');
});

describe('publish', () => {
  it('tries to connect if not connected', async () => {
    td.when(connection.isConnected()).thenReturn(false);

    await eventBus.publish({ data: 'foo' });

    td.verify(connection.connect());
  });

  it('throws if failed to create model', async () => {
    const error = new Error('foo');
    td.when(connection.createModel()).thenReject(error);

    await assert.rejects(eventBus.publish(), error);
  });

  it('throws if failed to assert exchange', async () => {
    const error = new Error('foo');
    td.when(channel.assertExchange(EventBus.brokerName, 'direct')).thenReject(
      error
    );

    await assert.rejects(eventBus.publish(), error);
  });

  it('throws if failed to publish message', async () => {
    td.when(
      channel.assertExchange(EventBus.brokerName, 'direct')
    ).thenResolve();
    const error = new Error('foo');
    const event = { type: 'bar', data: 'baz' };
    const jsonPayload = JSON.stringify(event.data);
    const content = Buffer.from(jsonPayload);
    const options = { persistent: true, mandatory: true };
    td.when(
      channel.publish(EventBus.brokerName, event.type, content, options)
    ).thenReject(error);

    await assert.rejects(eventBus.publish(event), error);
  });

  it('publishes message successfully', async () => {
    td.when(
      channel.assertExchange(EventBus.brokerName, 'direct')
    ).thenResolve();
    const payload = {
      foo: 'bar',
    };
    const event = { type: 'bar', data: payload };
    const jsonPayload = JSON.stringify(event.data);
    const content = Buffer.from(jsonPayload);
    const options = { persistent: true, mandatory: true };
    td.when(
      channel.publish(EventBus.brokerName, event.type, content, options)
    ).thenResolve();

    await assert.doesNotReject(eventBus.publish(event));
  });
});

describe('subscribe', () => {
  it('tries to connect if not connected', async () => {
    td.when(connection.isConnected()).thenReturn(false);
    const handler = () => {};

    await eventBus.subscribe({ data: 'foo' }, handler);

    td.verify(connection.connect());
  });

  it('throws if failed to create model', async () => {
    const error = new Error('foo');
    td.when(connection.createModel()).thenReject(error);

    await assert.rejects(eventBus.subscribe(), error);
  });

  it('throws if failed to assert exchange', async () => {
    const error = new Error('foo');
    td.when(channel.assertExchange(EventBus.brokerName, 'direct')).thenReject(
      error
    );

    await assert.rejects(eventBus.subscribe(), error);
  });

  it('throws if failed to assert queue', async () => {
    td.when(
      channel.assertExchange(EventBus.brokerName, 'direct')
    ).thenResolve();
    const error = new Error('foo');
    td.when(channel.assertQueue('my_queue')).thenReject(error);

    await assert.rejects(eventBus.subscribe(), error);
  });

  it('throws if failed to bind queue', async () => {
    td.when(
      channel.assertExchange(EventBus.brokerName, 'direct')
    ).thenResolve();
    td.when(channel.assertQueue('my_queue')).thenResolve();
    const error = new Error('foo');
    td.when(
      channel.bindQueue('my_queue', EventBus.brokerName, 'bar')
    ).thenReject(error);

    await assert.rejects(eventBus.subscribe('bar'), error);
  });

  it('throws if failed to consume message', async () => {
    td.when(
      channel.assertExchange(EventBus.brokerName, 'direct')
    ).thenResolve();
    td.when(channel.assertQueue('my_queue')).thenResolve();
    const error = new Error('foo');
    const event = { type: 'foo' };
    td.when(
      channel.bindQueue('my_queue', EventBus.brokerName, event.type)
    ).thenResolve();
    td.when(channel.consume('my_queue', td.matchers.anything())).thenReject(
      error
    );

    await assert.rejects(eventBus.subscribe(event), error);
  });

  it('acknowledges if consumed message successfully', async () => {
    td.when(
      channel.assertExchange(EventBus.brokerName, 'direct')
    ).thenResolve();
    td.when(channel.assertQueue('my_queue')).thenResolve();
    const event = { type: 'foo' };
    td.when(
      channel.bindQueue('my_queue', EventBus.brokerName, event.type)
    ).thenResolve();
    const payload = { bar: 'baz' };
    const message = {
      foo: 'bar',
      content: Buffer.from(JSON.stringify(payload)),
    };
    const callback = td.func();
    td.when(channel.consume('my_queue')).thenCallback(message);

    await assert.doesNotReject(eventBus.subscribe(event, callback));

    td.verify(callback(payload));
    td.verify(channel.ack(message));
  });
});
