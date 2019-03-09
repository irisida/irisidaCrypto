/**
 * pubsub pattern determines you can be a broadcaster (publisher)
 * or a reciever to channels. This means that broadcasts are to
 * that channel and that nodes are listening to that channel for
 * udates from other broadcastig nodes.
 */

const redis = require('redis')

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
}

class PubSub {
  constructor({ blockchain }) {
    this.blockchain = blockchain
    this.publisher = redis.createClient()
    this.subscriber = redis.createClient()

    this.subscribeToChannels()

    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message)
    })
  }

  /**
   * The handleMesage function accepts a channel and a message.
   * The message is parsed and stored.
   * We then check the channel is the blockchain channel and
   * if it is then the blockchain.replaceChain function is
   * called and the parsed message is added to the chain.
   * @param {*} channel
   * @param {*} message
   */
  handleMessage(channel, message) {
    console.log(`message received: Channel: ${channel} - message: ${message}`)
    const parsedMessage = JSON.parse(message)

    if (channel === CHANNELS.BLOCKCHAIN) {
      this.blockchain.replaceChain(parsedMessage)
    }
  }

  /**
   * subscribe to all the channels defined in
   * the CHANNELS object above.
   */
  subscribeToChannels() {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel)
    })
  }

  publish({ channel, message }) {
    this.publisher.publish(channel, message)
  }

  /**
   * broadcasts to the defined channel a new blockchain.
   * A new blockchain will contain the result of a call
   * to replaceChain where a new block is mined and added
   * locally. This allows other nodes listening to the
   * redis pubsub to receive the newly updated chain
   * that contins the new block.
   */
  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    })
  }
}

module.exports = PubSub
