import { connect } from 'amqplib';

class Connection {
  #connection = null;

  constructor(logger, config, retryCount = 3) {
    this.logger = logger;
    this.config = config;
    this.retryCount = retryCount;
  }

  isConnected() {
    return this.#connection !== null;
  }

  async connect() {
    try {
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
    } catch (error) {
      if (this.retryCount <= 0) {
        throw error;
      } else {
        while (this.retryCount > 0) {
          this.retryCount -= 1;
          await this.connect();
        }
      }
    }
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
