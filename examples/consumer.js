const AmqpService = require('..')
const amqpService = new AmqpService()

amqpService.start('amqp://localhost')

const queueName = 'test-queue'
amqpService.listen(queueName, (message) => {
  console.log('Message received:', message.payload)
  return message.release()
})
  .then(() => {
    console.log('Listening for messages')
  }).catch((error) => {
    console.log(`Error while listening to queue ${queueName}:`, error)
  })
