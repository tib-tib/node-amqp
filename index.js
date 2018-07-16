const amqp = require('amqp-connection-manager')

class AmqpService {
  constructor(url = 'amqp://localhost') {
    const connection = amqp.connect([url])
    connection.on('connect', () => console.log('Connected to RabbitMQ'));
    connection.on('disconnect', ({err}) => {
      console.log('Disconnected from RabbitMQ', err.stack)
    })
    this.connection = connection
  }

  listen(queue, messageHandler) {
    const channelWrapper = this.connection.createChannel({
      json: true,
      setup: (channel) => Promise.all([
        channel.assertQueue(queue, { durable: true }),
        channel.prefetch(1),
        channel.consume(queue, message => messageHandler({
          payload: JSON.parse(message.content.toString()),
          release: () => channelWrapper.ack(message),
          reject: () => channelWrapper.nack(message)
        }))
      ])
    })
    return channelWrapper.waitForConnect()
  }

  send(queue, message) {
    const channelWrapper = this.connection.createChannel({
      json: true,
      setup: channel => channel.assertQueue(queue)
    })
    return channelWrapper.sendToQueue(queue, message)
      .catch(error => {
        this.closeConnection()
        return Promise.reject(error)
      })
  }

  closeConnection() {
    if (this.connection) {
      this.connection.close()
    }
  }
}

module.exports = AmqpService
