const Block = require('../src/block')
const cryptoHash = require('../src/crypto-hash')
const { GENESIS_DATA, MINE_RATE } = require('../config/config')

describe('Block', () => {
  const timestamp = 2000
  const lastHash = 'dummyLastHash'
  const hash = 'dummyHash'
  const data = ['blockchain', 'dummyData']
  const nonce = 1
  const difficulty = 1
  const block = new Block({
    timestamp,
    lastHash,
    hash,
    data,
    nonce,
    difficulty,
  })

  it('has a timestamp property', () => {
    expect(block.timestamp).toEqual(timestamp)
  })

  it('has a lastHash property', () => {
    expect(block.lastHash).toEqual(lastHash)
  })

  it('has a hash property', () => {
    expect(block.hash).toEqual(hash)
  })

  it('has a data property', () => {
    expect(block.data).toEqual(data)
  })

  it('has a data property', () => {
    expect(block.nonce).toEqual(nonce)
  })

  it('has a data property', () => {
    expect(block.difficulty).toEqual(difficulty)
  })

  /**
   * Genesis block
   * Checks that the initial block
   * of the chain is an instance of the
   * genesis block.
   * Checks that the data in the chain
   * genesis block is equal to the
   * defined genesis block data.
   */
  describe('genesis()', () => {
    const genesisBlock = Block.genesis()

    it('returns a block instance', () => {
      expect(genesisBlock instanceof Block).toBe(true)
    })

    it('returns the genesis data', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA)
    })
  })

  /**
   * mine block
   * Checks that the new block mined is a
   * correct instance of our block class.
   * Checks that the new mined block has a
   * valid lastHash for the preceeding block
   * (genesis block in this case).
   * Checks that the block can be set to have
   * the data property equal to the data from
   * the mined block.
   * Checks the the timestamp is not left unset
   * (undefined)
   * Checks it can create a SHA-256 hash based
   * on the properties of the block.
   */
  describe('mineBlock()', () => {
    const lastBlock = Block.genesis()
    const data = 'mined data'
    const minedBlock = Block.mineBlock({ lastBlock, data })

    it('returns a block instance', () => {
      expect(minedBlock instanceof Block).toBe(true)
    })

    it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
      expect(minedBlock.lastHash).toEqual(lastBlock.hash)
    })

    it('sets the `data`', () => {
      expect(minedBlock.data).toEqual(data)
    })

    it('sets the `timestamp`', () => {
      expect(minedBlock.timestamp).not.toEqual(undefined)
    })

    it('creates a SHA-256 `hash` based on the proper inputs', () => {
      expect(minedBlock.hash).toEqual(
        cryptoHash(
          minedBlock.timestamp,
          minedBlock.nonce,
          minedBlock.difficulty,
          lastBlock.hash,
          data
        )
      )
    })

    it('sets a `hash` that matches the difficulty criteria', () => {
      expect(minedBlock.hash.substring(0, minedBlock.difficulty)).toEqual(
        '0'.repeat(minedBlock.difficulty)
      )
    })

    it('adjusts the difficulty', () => {
      const possibleResults = [
        lastBlock.difficulty + 1,
        lastBlock.difficulty - 1,
      ]

      expect(possibleResults.includes(minedBlock.difficulty)).toBe(true)
    })
  })

  /**
   * block difficulty tests
   * Checks that the system can dynamically
   * update the difficulty level based on
   * checks against the time it has taken to
   * mine a block against the desired time to
   * mine a block.
   * Checks that the difficuty rate is increased
   * where a block is mined too fast in comparison
   * to the mining rate stored in the config.
   * Checks that the difficulty rate is reduced
   * where a block is mined too slowly by
   * comparison to the preferred rate stored in
   * the config.
   * Checks the edge case where a number of
   * blocks are mined in rapid succession and
   * the difficulty rate could theoretically
   * reach a negative number. Setting a lower
   * tolerance limit prevents that case and the
   * subsequent crash that it would cause.
   */
  describe('adjustedDifficulty()', () => {
    it('raises the difficulty for a quickly mined block', () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE - 100,
        })
      ).toEqual(block.difficulty + 1)
    })

    it('lowers the difficulty for a slowly mined block', () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE + 100,
        })
      ).toEqual(block.difficulty - 1)
    })

    it('has a lower limit of 1', () => {
      block.difficulty = -1
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
        })
      ).toEqual(1)
    })
  })
})
