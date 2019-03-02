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
  constructor({ timestamp, lastHash, hash, data }) {
    this.timestamp = timestamp
    this.lastHash = lastHash
    this.hash = hash
    this.data = data
  }

  static genesis() {
    return new this(GENESIS_DATA)
  }

  static mineBlock({ lastBlock, data }) {
    const timestamp = Date.now()
    const lastHash = lastBlock.hash

    return new this({
      timestamp,
      lastHash,
      data,
      hash: cryptoHash(timestamp, lastHash, data),
    })
  }
}

module.exports = Block
