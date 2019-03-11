const { STARTING_BALANCE } = require('../../config/config')
const { ec } = require('../util/elliptic')

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE
    const keyPair = ec.genKeyPair()
    this.publicKey = keyPair.getPublic()
  }
}

module.exports = Wallet
