const MINE_RATE = 1000
const INITIAL_DIFFICULTY = 3
const STARTING_BALANCE = 1000
const REWARD_INPUT = { address: '*authorised-reward*' }
const MINING_REWARD = 10

/**
 * defines the genesis block of a
 * blockchain system.
 */
const GENESIS_DATA = {
  timestamp: 1,
  lastHash: '-----------',
  hash: 'genisishash',
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: [],
}

module.exports = {
  GENESIS_DATA,
  MINE_RATE,
  STARTING_BALANCE,
  REWARD_INPUT,
  MINING_REWARD,
}
