const amqp = require('amqp-connection-manager');

class AmqpService {
  constructor(args = {}) {
    this.connection = null;
    this.producerChannel = null;
    this.consumerChannel = null;

    this.queueConfig = {
      durable: true,
      arguments: args,
    };
  }

  start(url) {
    if (!url) {
      throw new Error('URL_MISSING');
    }
    if (!this.connection) {
      this.connection = amqp.connect([url]);
      this.connection.on('connect', () => console.log('Connected to RabbitMQ'));
      this.connection.on('disconnect', ({ err }) => {
        console.log('Disconnected from RabbitMQ', err.stack);
      });
    }
  }

  async createChannel(name, setup) {
    const channel = this.connection.createChannel({ name, json: true });

    await channel.waitForConnect();

    if (!this.connection.isConnected()) {
      return Promise.reject(new Error('NO_CONNECTION'));
    }
    if (setup) {
      await channel.addSetup(setup);
    }
    return channel;
  }

  async listen(queue, messageHandler) {
    if (!queue) {
      return Promise.reject(new Error('QUEUE_NAME_MISSING'));
    }

    if (!messageHandler || typeof messageHandler !== 'function') {
      console.warn('MESSAGE_HANDLER_MISSING');
    }

    if (!this.consumerChannel) {
      this.consumerChannel = await this.createChannel('consumer');
      this.consumerChannel.addSetup(channel => Promise.all([
        channel.assertQueue(queue, this.queueConfig),
        channel.prefetch(1),
        channel.consume(queue, message => messageHandler({
          payload: JSON.parse(message.content.toString()),
          release: () => this.consumerChannel.ack(message),
          reject: () => this.consumerChannel.nack(message),
        })),
      ]));
    }
    return Promise.resolve();
  }

  async send(queue, message) {
    if (!queue) {
      return Promise.reject(new Error('QUEUE_NAME_MISSING'));
    }

    if (!message || typeof message !== 'object') {
      return Promise.reject(new Error('MESSAGE_MISSING_OR_INVALID'));
    }

    if (!this.producerChannel) {
      this.producerChannel = await this.createChannel('publisher', channel => (
        channel.assertQueue(queue, this.queueConfig)
      ));
    }
    await this.producerChannel.sendToQueue(queue, message, { persistent: true });
    return null;
  }

  closeConnection() {
    if (this.connection) {
      this.connection.close();
    }
  }
}

module.exports = AmqpService;
