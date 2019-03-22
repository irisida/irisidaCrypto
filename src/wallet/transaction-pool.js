/**
 * The transactionPool
 */

const Transaction = require('./transaction')

class TransactionPool {
  constructor() {
    this.transactionMap = {}
  }

  /**
   * Clear the transactionPool
   */
  clear() {
    this.transactionMap = {}
  }

  /**
   * A controlled clearing of the chain to
   * avoid removing local transactions that
   * are not part of a transferred chain.
   */
  clearBlockchainTransactions({ chain }) {
    // start at 1 to avoid the genesis block
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i]

      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id]
        }
      }
    }
  }

  /**
   * Adds a new transaction to the transactionMap
   * object of the transactionPool.
   */
  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction
  }

  /**
   * accepts a transactionMap argument that is coming
   * from the root node. It will set the transaction map
   * fpr the entire pool.
   */
  setMap(transactionMap) {
    this.transactionMap = transactionMap
  }

  /**
   * receives an address (senderWallet.publicKey) to
   * check for existing transactions for that inputAddress
   * on the transactionMap object.
   */
  existingTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactionMap)

    return transactions.find(
      transaction => transaction.input.address === inputAddress
    )
  }

  validTransactions() {
    return Object.values(this.transactionMap).filter(transaction =>
      Transaction.validTransaction(transaction)
    )
  }
}

module.exports = TransactionPool
