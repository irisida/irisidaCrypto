/**
 * key structure of the blockchain is the block itself.
 * A block consists of 4 key attributes, the timestamp
 * which is a created date and timestamp. The lastHash
 * is the hash value of the preceeding block. The hash
 * is a hash generated from all the unique pieces of a
 * block instance itself and the data is essentially
 * an array of values or data items.
 */

const { GENESIS_DATA } = require('../config/config')
const cryptoHash = require('./crypto-hash')

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

  static mineBlock({ lastBlock, data }) {
    let hash, timestamp
    const lastHash = lastBlock.hash
    const { difficulty } = lastBlock
    let nonce = 0

    do {
      nonce++
      timestamp = Date.now()
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty)
    } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty))

    return new this({
      timestamp,
      lastHash,
      data,
      difficulty,
      nonce,
      hash,
    })
  }
}

module.exports = Block
