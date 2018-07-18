# Node RabbitMQ wrapper

Wrapper around npm package [`amqp-connection-manager`](https://github.com/benbria/node-amqp-connection-manager).\
Exposes 4 methods: `start`, `listen`, `send` and `closeConnection`.

## Producer example

```
const AmqpService = require('node-rabbitmq-wrapper')
const amqpService = new AmqpService()

const queueName = 'test-queue'
const message = {
    id: `random-id-${Math.round(Math.random() * 10000)}`,
    text: 'Bacon ipsum dolor amet prosciutto landjaeger bresaola short loin ribeye.'
}

amqpService.start('amqp://localhost')

amqpService.send(queueName, message)
  .then(() => {
    console.log('Message', JSON.stringify(message), 'sent to queue', queueName)
  }).catch((error) => {
    console.log('An error occured while sending message:', error)
  })
```

## Consumer example

```
const AmqpService = require('node-rabbitmq-wrapper')
const amqpService = new AmqpService()

amqpService.start('amqp://localhost')

amqpService.listen('test-queue', (message) => {
  console.log('Message received:', message.payload)
  return message.release()
})
  .then(() => {
    console.log('Listening for messages')
  }).catch((error) => {
    console.log(`Error while listening to queue ${queueName}:`, error)
  })
```

