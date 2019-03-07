/**
 * pubsub pattern determines you can be a broadcaster (publisher)
 * or a reciever to channels. This means that broadcasts are to
 * that channel and that nodes are listening to that channel for
 * udates from other broadcastig nodes.
 */

const redis = require('redis')

const CHANNELS = {
  TEST: 'TEST',
}

class PubSub {
  constructor() {
    this.publisher = redis.createClient()
    this.subscriber = redis.createClient()

    this.subscriber.subscribe(CHANNELS.TEST)

    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message)
    })
  }

  handleMessage(channel, message) {
    console.log(`message received: Channel: ${channel} - message: ${message}`)
  }
}

const testPubSub = new PubSub()

setTimeout(() => testPubSub.publisher.publish(CHANNELS.TEST, 'it works!'), 1000)
