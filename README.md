# event-bus

A simple event bus abstraction backed by RabbitMQ

```js
import { initEventBus } from 'event-bus';

const eventBus = initEventBus(logger, connectionConfig, queueName);

const eventType = 'price_changed';
const event = {
  type: eventType,
  data: {
    oldPrice: 5,
    newPrice: 4,
  },
};
await eventBus.publish(event);
await eventBus.subscribe(eventType, (data) => {
  console.log(`Price changed from ${data.oldPrice} to ${data.newPrice}`);
});
```

## Installation

This is a Node.js module. To install:

```bash
npm install event-bus
```

## Features

- Publish event to event bus
- Subscribe to event bus to receive event

## Tests

To run the test suite, run `npm test`

## License

[MIT](LICENSE)
