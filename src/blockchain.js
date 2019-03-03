const Block = require('./block')
const cryptoHash = require('./crypto-hash')

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

  replaceChain(chain) {
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

    console.log('replacing chain with ', chain)
    this.chain = chain
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

    for (let i = 1; i < chain.length; i++) {
      /**
       * traverse the blockchain looking for lastHash
       * mismatches. This verifies the lastHash integrity
       * of the chain under validation checks.
       */
      const { timestamp, lastHash, hash, data } = chain[i]
      const actualLastHash = chain[i - 1].hash

      if (lastHash !== actualLastHash) {
        return false
      }

      /**
       * the chain is now validated for linked integrity
       * so now we must test that no data has been changed.
       * To do so we measure a computed hash against the
       * stored hash.
       */
      const validatedHash = cryptoHash(timestamp, lastHash, data)

      if (hash !== validatedHash) {
        return false
      }
    }

    return true
  }
}

module.exports = Blockchain
