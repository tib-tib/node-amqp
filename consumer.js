const AmqpService = require('.')
const amqpService = new AmqpService()

amqpService.listen('test-queue', (message) => {
  console.log('Message received:', message.payload)
  return message.release()
})
  .then(() => {
    console.log('Listening for messages')
  }).catch((error) => {
    console.log(`Error while listening to queue ${queueName}:`, error)
  })
