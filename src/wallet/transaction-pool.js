/**
 * The transactionPool
 */

class TransactionPool {
  constructor() {
    this.transactionMap = {}
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
}

module.exports = TransactionPool
