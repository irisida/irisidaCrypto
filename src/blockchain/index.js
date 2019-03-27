const Block = require('./block')
const { cryptoHash } = require('../util/elliptic')
const Transaction = require('../wallet/transaction')
const Wallet = require('../wallet/index')
const { REWARD_INPUT, MINING_REWARD } = require('../../config/config')

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()]
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    })

    this.chain.push(newBlock)
  }

  replaceChain(chain, onSuccess) {
    /**
     * The business rules behind the chain replacement
     * mechanism are that a chain can only be replaced
     * where:
     * 1: The chain is longer than the existing chain
     * in order that no blocks are lost.
     * 2: The chain must be deemed as being valid when
     * tested against any tampering of the blocks or
     * chain content.
     */
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer')
      return
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('incoming chain must be valid')
      return
    }

    if (onSuccess) onSuccess()

    console.log('replacing chain with ', chain)
    this.chain = chain
  }

  /**
   * validTransactionData method
   * implements 4 horsemen rules
   */
  validTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i]
      const transationSet = new Set()
      let rewardTransactionCount = 0

      //check rule 1
      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1

          if (rewardTransactionCount > 1) {
            console.error('miner reward exceed limit')
            return false
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward is invalid')
            return false
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction')
            return false
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address,
          })

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount')
            return false
          }

          if (transationSet.has(transaction)) {
            console.error('Identical transaction appears multiple times')
            return false
          } else {
            transationSet.add(transaction)
          }
        }
      }
    }

    return true
  }

  static isValidChain(chain) {
    /**
     * use JSON.stringify to create an equality basis
     * given that the strict check would fail because
     * they are two differnet objects.
     */
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      return false
    }

    /**
     * traverse the blockchain performing the following
     * validations checks:
     *
     * Checks for lastHash mismatches where found the
     * block is rejected.
     * Looks for tampered hash values. A new hash is computed
     * against the block attributes and checked against
     * the proposed hash. If not matched the block
     * is rejected.
     * The block is checked to ensure no large difficulty
     * jumps have occurred to prevent massively reduced
     * difficulty being added to the chain. This safeguarding
     * measure will trigger a false return if the difficulty
     * has jumped by more than 1.
     */
    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, data, nonce, difficulty } = chain[i]
      const actualLastHash = chain[i - 1].hash
      const lastDifficulty = chain[i - 1].difficulty

      /**
       * lasthash check point
       */
      if (lastHash !== actualLastHash) {
        return false
      }

      /**
       * the chain is now validated for linked integrity so now we must test
       * that no data has been changed. To do so we measure a computed hash
       * against the stored hash.
       */
      const validatedHash = cryptoHash(
        timestamp,
        lastHash,
        data,
        nonce,
        difficulty
      )

      if (hash !== validatedHash) {
        return false
      }

      /**
       * The chain must be guarded against difficult jumps to prevent
       * hijacking with any significantly lowered / raised difficulty
       * allowing for a bad block or series of bad blocks to be added
       * to the chain.
       */
      if (Math.abs(lastDifficulty - difficulty) > 1) return false
    }

    /**
     * All checks for validity have passed so the block is marked as
     * valid and the the block can continue.
     */
    return true
  }
}

module.exports = Blockchain
