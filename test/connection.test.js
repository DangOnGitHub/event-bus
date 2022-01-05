import assert from 'assert';

let connectionModule;
let connection;
let amqp;
let config;
let underlyingConnection;
beforeEach(async () => {
  amqp = await td.replaceEsm('amqplib');
  connectionModule = await import('../lib/connection.js');
  config = {
    hostname: 'foo',
    port: 1,
    username: 'bar',
    password: 'baz',
  };
  connection = new connectionModule.Connection(logger, config);
  underlyingConnection = {
    _event: null,
    _callback: undefined,
    _createChannelCalled: 0,
    _channel: { foo: 'bar' },

    on(event, callback) {
      this._event = event;
      this._callback = callback;
    },

    createChannel() {
      this._createChannelCalled += 1;
      return this._channel;
    },
  };
});

describe('isConnected', () => {
  it('returns false if not connected', () => {
    const result = connection.isConnected();

    assert.equal(result, false);
  });
});

describe('connect', () => {
  it('throws error if failed to connect', async () => {
    const error = new Error('wrong host');
    td.when(amqp.connect(config)).thenReject(error);

    await assert.rejects(connection.connect(), error);

    assert.equal(connection.isConnected(), false);
  });

  it('does not throw if connect successfully', async () => {
    td.when(amqp.connect(config)).thenResolve(underlyingConnection);

    await assert.doesNotReject(connection.connect());

    assert.equal(connection.isConnected(), true);
  });

  it('retries if failed to connect', async () => {
    connection = new connectionModule.Connection(logger, config, 1);
    const firstError = new Error('foo');
    const secondError = new Error('bar');
    td.when(amqp.connect(config)).thenReject(firstError, secondError);

    await assert.rejects(connection.connect(), secondError);
  });

  it('does not retry if out of retry count', async () => {
    connection = new connectionModule.Connection(logger, config, 0);
    const firstError = new Error('foo');
    const secondError = new Error('bar');
    td.when(amqp.connect(config)).thenReject(firstError, secondError);

    await assert.rejects(connection.connect(), firstError);
  });
});

describe('createModel', () => {
  it('throws error if not connected', async () => {
    await assert.rejects(connection.createModel());
  });

  it('creates Channel if connected', async () => {
    td.when(amqp.connect(config)).thenResolve(underlyingConnection);
    await connection.connect();

    const model = await connection.createModel();
    assert.equal(underlyingConnection._createChannelCalled, 1);
    assert.equal(model, underlyingConnection._channel);
  });
});
