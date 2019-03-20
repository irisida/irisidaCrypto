/**
 * The pubsub pattern determines you can be a
 * broadcaster (think publisher), or a reciever
 * to channels.
 * This means that broadcasts are to that channel and
 * that nodes are listening to that channel for
 * updates from the other broadcasting nodes.
 */

const redis = require('redis')

/**
 * The CHANNELS object holds all of the
 * channels exposed by the blockchain
 * system. Channels are subscribed to
 * by peers on the network so that they
 * can send/receive broadcasts.
 */
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
   * The handleMesage function accepts a channel and
   * a message. The message is parsed and stored.
   * The switch on the channel determines which channel
   * has passed the message.
   *
   * Where the message is:
   * BLOCKCHAIN
   * it calls the replaceChain method with the value
   * of the parsedMessage.
   *
   * Where the message is:
   * TRANSACTION
   * it calls the setTransaction method on the
   * transactionPool and passes in the
   * parsedMessage.
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
   * Helper method with the purpose of
   * Subscribing to ALL of the channels
   * defined in the CHANNELS object
   * above.
   */
  subscribeToChannels() {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel)
    })
  }

  /**
   * Creates a three step process where the:
   * 1) local node unsubscribes to channel prior
   * to publishing.
   * This is done to prevent it publishing to itself
   * given it is also subscribed to the channel.
   *
   * 2) perform the publish action
   * This takes the channel and the message.
   *
   * 3) Resubscribe to the channel
   * Done to ensure it receives published blocks
   * from other nodes of the network. This is
   * required in order to be able to sync/update
   * the chain.
   */
  publish({ channel, message }) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel)
      })
    })
  }

  /**
   * broadcasts a new blockchain to the BLOCKCHAIN
   * channel.
   * A new blockchain will contain the result of a call
   * to replaceChain where a new block is mined and added
   * locally.
   * Other nodes listening to the redis pubsub will
   * receive the newly updated chain that contins the
   * new block.
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
