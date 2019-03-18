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
  TRANSACTION: 'TRANSACTION',
}

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain
    this.transactionPool = transactionPool
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
   *
   * Moved to a switch for ease in future additons to
   * channels.operations. New addition equals a new
   * switch case.
   */
  handleMessage(channel, message) {
    console.log(`message received: Channel: ${channel} - message: ${message}`)
    const parsedMessage = JSON.parse(message)

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage)
        break
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage)
        break
      default:
        return
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

  /**
   * Creates a three step process where the local node
   * unsubscribes to the channel prior to publishing, this
   * is done to prevent it publishing to itself given it's
   * subscribed to the channel. Then the publish is done
   * and the closing action is to resubscribe to the
   * channel to ensure receiving other node published
   * blocks to be able to sync/update the chain.
   */
  publish({ channel, message }) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel)
      })
    })
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

  /**
   * broadcasts a new transaction
   * Accepts a transaction and calls the publish.
   * message has to be json.strinified
   */
  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    })
  }
}

module.exports = PubSub
