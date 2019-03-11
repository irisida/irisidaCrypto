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
const cryptoHash = require('../helpers/crypto-hash')

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

  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock

    if (difficulty < 1) return 1

    if (timestamp - originalBlock.timestamp > MINE_RATE) return difficulty - 1

    return difficulty + 1
  }
}

module.exports = Block