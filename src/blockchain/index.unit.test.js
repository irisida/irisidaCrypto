const Blockchain = require('./index')
const Block = require('./block')
const { cryptoHash } = require('../util/elliptic')
const Wallet = require('../wallet/index')
const Transaction = require('../wallet/transaction')

/**
 * blockchain class unit test cases
 */

describe('Blockchain', () => {
  let blockchain, newChain, originalChain, errorMock

  beforeEach(() => {
    errorMock = jest.fn()
    blockchain = new Blockchain()
    newChain = new Blockchain()

    originalChain = blockchain.chain
    global.console.error = errorMock
  })

  /**
   * Checks:
   * Chain is a vlaid data structure.
   * Chain starts with a genesis block.
   * Chain can successfully have a new
   * blocked added.
   */

  it('contains a `chain` Array instance', () => {
    expect(blockchain.chain instanceof Array).toBe(true)
  })

  it('starts with the genesis block', () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis())
  })

  it('adds a new block to the chain', () => {
    const newData = 'data sample value'
    blockchain.addBlock({ data: newData })

    expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData)
  })

  /**
   * Chain validation
   * Checks:
   * When the chain does not start with a genesis block
   * the chain is deemed invalid.
   * When a multi-block chain is interogated
   * and a lastHash reference has changed the
   * chain is deemed as invalid.
   * When a chain is found to have a data item or
   * field that has changed the chain is deemed to
   * be invalid.
   * If an interogated chain is deemed valid then
   * the chain is returned as true and valid.
   */
  describe('isValidChain()', () => {
    describe('when the chain does not start with the genesis block', () => {
      it('returns false', () => {
        blockchain.chain[0] = { data: 'fake-genesis' }

        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
      })
    })

    describe('when the chain does start with the genesis block and has multiple blocks', () => {
      beforeEach(() => {
        blockchain.addBlock({ data: 'some block data' })
        blockchain.addBlock({ data: 'more block data' })
        blockchain.addBlock({ data: 'next block data' })
      })

      describe('and a last hash reference has changed', () => {
        it('returns false', () => {
          blockchain.chain[2].lastHash = 'broken-lastHash'
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
        })
      })

      describe('and the chain contains a block with an invalid field', () => {
        it('returns false', () => {
          blockchain.chain[2].data = 'modified data value'
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
        })
      })

      describe('and the chain contains a blocked with a jumped difficulty', () => {
        it('returns flase', () => {
          const lastBlock = blockchain.chain[blockchain.chain.length - 1]
          const lastHash = lastBlock.hash
          const timestamp = Date.now()
          const nonce = 0
          const data = []
          const difficulty = lastBlock.difficulty - 3

          const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data)

          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            nonce,
            difficulty,
            data,
          })

          blockchain.chain.push(badBlock)

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
        })
      })

      describe('and the chain does not contain invalid blocks', () => {
        it('returns true', () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true)
        })
      })
    })
  })

  /**
   * Replace chain mechanism
   * Checks:
   * When the chain is not longer that it does
   * not replace the chain.
   * Checks that when the chain is longer but
   * invalid that it does not replace the
   * chain and catches error.
   * Checks that when the chain is longer
   * and the chain is valid that the chain is
   * replaced as expected.
   */
  describe('replaceChain()', () => {
    let logMock

    beforeEach(() => {
      logMock = jest.fn()
      global.console.log = logMock
    })

    describe('when the new chain is not longer', () => {
      beforeEach(() => {
        /**
         * modify the newChain to stop it comparing
         * to itself. removes the guaranteed pass.
         */
        newChain.chain[0] = { new: 'chain' }
        blockchain.replaceChain(newChain.chain)
      })

      it('does not replace the chain', () => {
        expect(blockchain.chain).toEqual(originalChain)
      })

      it('logs an error', () => {
        expect(errorMock).toHaveBeenCalled()
      })
    })

    describe('when the new chain is longer', () => {
      beforeEach(() => {
        /**
         * ensure the chain is longer by adding
         * some blocks to the chain under test.
         */
        newChain.addBlock({ data: 'added some block data' })
        newChain.addBlock({ data: 'added more block data' })
        newChain.addBlock({ data: 'added next block data' })
      })

      describe('and newChain is invalid', () => {
        beforeEach(() => {
          /**
           * invalidate the chain and call the
           * replaceChain method.
           */
          newChain.chain[2].hash = 'faked-hash-data'
          blockchain.replaceChain(newChain.chain)
        })

        it('does not replace the chain', () => {
          expect(blockchain.chain).toEqual(originalChain)
        })

        it('logs an error', () => {
          expect(errorMock).toHaveBeenCalled()
        })
      })

      /**
       * positive test case
       * the chain is longer and the chain
       * is valid. Calls the replaceChain and
       * tests the output.
       */
      describe('and the chain is valid', () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain)
        })
        it('replaces the chain', () => {
          expect(blockchain.chain).toEqual(newChain.chain)
        })

        it('logs about chain replacement', () => {
          expect(logMock).toHaveBeenCalled()
        })
      })
    })
  })

  /**
   * The four horsemen method
   * This tests the most complex part of the
   * project which is to verify and prove
   * trust of each transaction within the block
   * and in every block of the chain.
   * It MUST verify the four rules
   */
  describe('validTransactionData()', () => {
    let transaction, rewardTransaction, wallet

    beforeEach(() => {
      wallet = new Wallet()
      transaction = wallet.createTransaction({
        recipient: 'testRecipient',
        amount: 75,
      })
      rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet })
    })

    describe('and the transaction data is valid', () => {
      it('returns true', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction] })

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          true
        )
        expect(errorMock).not.toHaveBeenCalled()
      })
    })

    // rule 1
    describe('and the transaction data multiple rewards', () => {
      it('returns false and logs an error', () => {
        newChain.addBlock({
          data: [transaction, rewardTransaction, rewardTransaction],
        })
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(
          false
        )
        expect(errorMock).toHaveBeenCalled()
      })
    })

    // rule 2
    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('returns false and logs an error', () => {
          transaction.outputMap[wallet.publicKey] = 9999999
          newChain.addBlock({ data: [transaction, rewardTransaction] })

          expect(
            blockchain.validTransactionData({ chain: newChain.chain })
          ).toBe(false)
          expect(errorMock).toHaveBeenCalled()
        })
      })

      describe('and the transaction is a reward transaction', () => {
        it('returns false and logs an error', () => {
          rewardTransaction.outputMap[wallet.publicKey] = 999999
          newChain.addBlock({ data: [transaction, rewardTransaction] })

          expect(
            blockchain.validTransactionData({ chain: newChain.chain })
          ).toBe(false)
          expect(errorMock).toHaveBeenCalled()
        })
      })
    })

    // rule 3
    describe('and the transaction data has at least one malformed input', () => {
      it('returns false and logs an error', () => {
        //expect(errorMock).toHaveBeenCalled()
      })
    })

    // rule 4
    describe('and a block contains multiple identical transactions', () => {
      it('returns false and logs an error', () => {
        //expect(errorMock).toHaveBeenCalled()
      })
    })
  })
})
