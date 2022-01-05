/**
 * An event bus abstraction.
 * @module EventBus
 */
class EventBus {
  static brokerName = 'event_bus';

  constructor(logger, connection, queue) {
    this.logger = logger;
    this.connection = connection;
    this.queue = queue;
  }

  /**
   * Publish an integration event.
   * @param {Object} integrationEvent
   * @param {string} integrationEvent.type Used as routing key.
   * @param {Object} integrationEvent.data The actual payload.
   */
  async publish(integrationEvent) {
    if (!this.connection.isConnected()) {
      await this.connection.connect();
    }

    this.logger.info('Creating RabbitMQ channel to publish event');
    const channel = await this.connection.createModel();

    this.logger.info('Declaring RabbitMQ exchange to publish event');
    await channel.assertExchange(EventBus.brokerName, 'direct');

    const jsonPayload = JSON.stringify(integrationEvent.data);
    const content = Buffer.from(jsonPayload);
    const options = { persistent: true, mandatory: true };
    this.logger.info('Publishing event to RabbitMQ');
    await channel.publish(
      EventBus.brokerName,
      integrationEvent.type,
      content,
      options
    );
  }

  /**
   * @callback IntegrationEventHandler
   * @param {Object} payload The payload consumed from queue.
   */

  /**
   * Subscribe to an integration event.
   * @param {string} integrationEventType Used as routing key.
   * @param {IntegrationEventHandler} integrationEventHandler
   */
  async subscribe(integrationEventType, integrationEventHandler) {
    if (!this.connection.isConnected()) {
      await this.connection.connect();
    }

    this.logger.info('Creating RabbitMQ channel to subscribe event');
    const channel = await this.connection.createModel();

    this.logger.info('Declaring RabbitMQ exchange to subscribe event');
    await channel.assertExchange(EventBus.brokerName, 'direct');

    this.logger.info('Declaring RabbitMQ queue to subscribe event');
    await channel.assertQueue(this.queue);

    await channel.bindQueue(
      this.queue,
      EventBus.brokerName,
      integrationEventType
    );
    this.logger.info('Consuming event from RabbitMQ');
    await channel.consume(this.queue, async (message) => {
      try {
        const payload = JSON.parse(message.content.toString());
        await integrationEventHandler(payload);
      } catch (error) {
        this.logger.error(error);
      }
      await channel.ack(message);
    });
  }
}

export { EventBus };
