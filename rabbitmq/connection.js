import { connect } from 'amqplib';

class Connection {
  #connection = null;

  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
  }

  isConnected() {
    return this.#connection !== null;
  }

  async connect() {
    this.logger.info('RabbitMQ Client is trying to connect');
    this.#connection = await connect(this.config);
    this.#connection.on('close', () => {
      this.logger.info('RabbitMQ Client is closing');
      this.#connection = null;
    });
    this.#connection.on('error', (error) => {
      this.logger.error(error);
      this.#connection = null;
    });
    this.#connection.on('blocked', (reason) => {
      this.logger.warn(reason);
      this.#connection = null;
    });
  }

  async createModel() {
    if (!this.isConnected()) {
      throw new Error(
        'No RabbitMQ connections are available to perform this action'
      );
    }
    return await this.#connection.createChannel();
  }
}

export { Connection };
