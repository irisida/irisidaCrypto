const Blockchain = require('../src/blockchain')
const Block = require('../src/block')
const cryptoHash = require('../src/crypto-hash')

/**
 * blockchain class unit test cases
 */

describe('Blockchain', () => {
  let blockchain, newChain, originalChain

  beforeEach(() => {
    blockchain = new Blockchain()
    newChain = new Blockchain()
    originalChain = blockchain.chain
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
    let errorMock, logMock

    beforeEach(() => {
      errorMock = jest.fn()
      logMock = jest.fn()

      global.console.error = errorMock
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
})
