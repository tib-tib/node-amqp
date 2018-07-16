const AmqpService = require('.')
const amqpService = new AmqpService()

const queueName = 'test-queue'
const message = {
    id: `random-id-${Math.round(Math.random() * 10000)}`,
    text: 'Bacon ipsum dolor amet prosciutto landjaeger bresaola short loin ribeye.'
}

amqpService.send(queueName, message)
  .then(() => {
    console.log('Message', JSON.stringify(message), 'sent to queue', queueName)
    amqpService.closeConnection()
  }).catch((error) => {
    console.log('An error occured while sending message:', error)
  })

