/**
 * key structure of the blockchain is the block itself.
 * A block consists of 4 key attributes, the timestamp
 * which is a created date and timestamp. The lastHash
 * is the hash value of the preceeding block. The hash
 * is a hash generated from all the unique pieces of a
 * block instance itself and the data is essentially
 * an array of values or data items.
 */

const hexToBinary = require('hex-to-binary')
const { GENESIS_DATA, MINE_RATE } = require('../../config/config')
const { cryptoHash } = require('../util/elliptic')

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
    this.timestamp = timestamp
    this.lastHash = lastHash
    this.hash = hash
    this.data = data
    this.nonce = nonce
    this.difficulty = difficulty
  }

  static genesis() {
    return new this(GENESIS_DATA)
  }

  /**
   * Creates a new block.
   * A new block is created by taking in the
   * lastBlock of the chain and the data that
   * is to make up the new block.
   * It creates a new block by creating a hash
   * of the combined properties of a block
   * and will repeatedly recalculate the hash
   * up to the difficulty length.
   * Once confirmed (mined) the block is
   * returned.
   */
  static mineBlock({ lastBlock, data }) {
    let hash, timestamp
    const lastHash = lastBlock.hash
    let { difficulty } = lastBlock
    let nonce = 0

    do {
      nonce++
      timestamp = Date.now()
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      })
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty)
    } while (
      hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty)
    )

    return new this({
      timestamp,
      lastHash,
      data,
      difficulty,
      nonce,
      hash,
    })
  }

  /**
   * The blockchain difficulty is a fluctuating value.
   * It is based on the time taken between last and
   * new blocks being mined and measured agains the
   * MINE_RATE which is a configuration setting of
   * the system/network.
   * Controls are in place to prevent large jumps
   * upward or downward. To enable this control the
   * difficulty of the the last block mined is measured
   * against timestamps and mining rate and adjusted
   * in single increments or decrements.
   */
  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock

    if (difficulty < 1) return 1

    if (timestamp - originalBlock.timestamp > MINE_RATE) return difficulty - 1

    return difficulty + 1
  }
}

module.exports = Block
