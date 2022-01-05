import { Connection } from './lib/connection.js';
import { EventBus } from './lib/event-bus.js';

/**
 * An object that can log different NPM levels (such as winston).
 * @typedef {Object} Logger
 */

/**
 * Init the event bus
 * @param {Logger} logger
 * @param {Object} connectionConfig
 * @param {string} connectionConfig.hostname
 * @param {number} connectionConfig.port
 * @param {string} connectionConfig.username
 * @param {string} connectionConfig.password
 * @param {string} queueName The name of the queue that will be subscribed to.
 * @param {number} retryCount The number of connection retries, default to 3 if null.
 * @returns {EventBus} an event bus that can be used to publish or subscribe.
 */
export function initEventBus(logger, connectionConfig, queueName, retryCount) {
  let connection;
  if (retryCount) {
    connection = new Connection(logger, connectionConfig, retryCount);
  } else {
    connection = new Connection(logger, connectionConfig);
  }
  return new EventBus(logger, connection, queueName);
}
