const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index')
const Blockchain = require('../blockchain/index')

describe('TransactionPool', () => {
  let transactionPool, transaction, senderWallet

  beforeEach(() => {
    transactionPool = new TransactionPool()
    senderWallet = new Wallet()
    transaction = new Transaction({
      senderWallet,
      recipient: 'dodgy-recipient',
      amount: 50,
    })
  })

  describe('setTransaction()', () => {
    it('adds a transaction', () => {
      transactionPool.setTransaction(transaction)

      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction)
    })
  })

  describe('existingTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPool.setTransaction(transaction)

      expect(
        transactionPool.existingTransaction({
          inputAddress: senderWallet.publicKey,
        })
      ).toBe(transaction)
    })
  })

  describe('validTransaction()', () => {
    let validTransactions, errorMock

    beforeEach(() => {
      validTransactions = []
      errorMock = jest.fn()
      global.console.error = errorMock

      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          senderWallet,
          recipient: 'any-recipient',
          amount: 50,
        })
        /**
         * invalidate every transaction case that is
         * divisible by three. This is an arbitrary
         * choice and has no meaning excpet to have
         * some invalid transactions in the list.
         */
        if (i % 3 === 0) {
          transaction.input.amount = 5000000
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign(
            'invalidSignatureValiue'
          )
        } else {
          // load the good cases to the array
          validTransactions.push(transaction)
        }

        transactionPool.setTransaction(transaction)
      }
    })

    it('returns valid transaction', () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions)
    })

    it('logs errors for the invalid transactions', () => {
      transactionPool.validTransactions()
      expect(errorMock).toHaveBeenCalled()
    })
  })

  describe('clear()', () => {
    it('clears the transactions', () => {
      transactionPool.clear()

      expect(transactionPool.transactionMap).toEqual({})
    })
  })

  describe('clearBlockchainTransactions()', () => {
    it('clears the pool of any existing blockchain transactions', () => {
      const blockchain = new Blockchain()
      const expectedTransactionMap = {}

      for (let i = 0; i < 6; i++) {
        const transaction = new Wallet().createTransaction({
          recipient: 'testRecipient',
          amount: 10,
        })

        transactionPool.setTransaction(transaction)

        // add every even transaction from the loop
        // to the local blockchain
        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] })
        } else {
          // add it to the expectedTransactionMap
          expectedTransactionMap[transaction.id] = transaction
        }
      }

      transactionPool.clearBlockchainTransactions({
        chain: blockchain.chain,
      })

      expect(transactionPool.transactionMap).toEqual(expectedTransactionMap)
    })
  })
})
