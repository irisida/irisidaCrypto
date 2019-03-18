/**
 * Gets the transaction data that will make up
 * a new block from the transactionPool.
 * Should not arbitrarily grab all the data
 * as it's freely netowrk contributed. To
 * protect the system it should determine and
 * select on the valid transactions
 */

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain
    this.transactionPool = transactionPool
    this.wallet = wallet
    this.pubsub = pubsub
  }

  mineTransactions() {
    // get the transactionPools valid transactions
    // generate the miners reward
    // add a block consisting of the transactions to the blockchain.
    // broadcast the updated blockchain
    // clear the transactionPool
  }
}

module.exports = TransactionMiner
