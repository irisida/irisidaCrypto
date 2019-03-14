const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index')

describe('TransactionPool', () => {
  let transactionPool, transaction

  beforeEach(() => {
    transactionPool = new TransactionPool()
    transaction = new Transaction({
      senderWallet: new Wallet(),
      recipient: 'dodgy-recipient',
      amount: 50,
    })
  })

  describe('setransaction()', () => {
    it('adds a transaction', () => {
      transactionPool.setTransaction(transaction)

      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction)
    })
  })
})
