const Transaction = require('../wallet/transaction')

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
    const validTransactions = this.transactionPool.validTransactions()

    // generate the miners reward
    validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    )

    // add a block consisting of the transactions to the blockchain.
    this.blockchain.addBlock({ data: validTransactions })

    // broadcast the updated blockchain
    this.pubsub.broadcastChain()

    // clear the transactionPool
    this.transactionPool.clear()
  }
}

module.exports = TransactionMiner
