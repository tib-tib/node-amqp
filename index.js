const amqp = require('amqp-connection-manager');

class AmqpService {
  constructor(args = {}) {
    this.consumerConnection = null;
    this.producerConnection = null;

    this.queueConfig = {
      durable: true,
      arguments: args,
    };
  }

  static createConnection(url, isProducer) {
    const connection = amqp.connect([url]);
    const prefix = isProducer ? 'Producer' : 'Consumer';

    connection.on('connect', () => console.log(`${prefix} connected to RabbitMQ`));
    connection.on('disconnect', ({ err }) => {
      console.log(`${prefix} disconnected from RabbitMQ`, err.stack);
    });
    return connection;
  }

  start(url) {
    if (!url) {
      throw new Error('URL_MISSING');
    }
    this.consumerConnection = AmqpService.createConnection(url, true);
    this.producerConnection = AmqpService.createConnection(url, false);
  }

  async listen(queue, messageHandler) {
    if (!queue) {
      return Promise.reject(new Error('QUEUE_NAME_MISSING'));
    }

    if (!messageHandler || typeof messageHandler !== 'function') {
      console.warn('INCORRECT_MESSAGE_HANDLER');
    }

    const consumerChannel = this.consumerConnection.createChannel({ json: true });
    consumerChannel.on('close', () => console.log('Consumer channel closed'));
    consumerChannel.on('error', error => console.log('Consumer channel error:', error));

    await consumerChannel.waitForConnect();

    if (!this.consumerConnection.isConnected()) {
      return Promise.reject(new Error('NO_CONNECTION'));
    }

    return consumerChannel.addSetup(channel => Promise.all([
      channel.assertQueue(queue, this.queueConfig),
      channel.prefetch(1),
      channel.consume(queue, message => messageHandler({
        payload: JSON.parse(message.content.toString()),
        release: () => consumerChannel.ack(message),
        reject: () => consumerChannel.nack(message),
      })),
    ]));
  }

  async send(queue, message) {
    if (!this.producerConnection.isConnected()) {
      return Promise.reject(new Error('NO_CONNECTION'));
    }

    const producerChannel = this.producerConnection.createChannel({ json: true });
    producerChannel.on('close', () => console.log('Producer channel closed'));
    producerChannel.on('error', error => console.log('Producer channel error:', error));

    await producerChannel.waitForConnect();
    await producerChannel.addSetup(channel => channel.assertQueue(queue, this.queueConfig));
    return producerChannel.sendToQueue(queue, message, { persistent: true });
  }

  closeConnection() {
    if (this.consumerConnection) {
      this.consumerConnection.close();
    }

    if (this.producerConnection) {
      this.producerConnection.close();
    }
  }
}

module.exports = AmqpService;
