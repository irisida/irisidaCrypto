const Transaction = require('./transaction')
const { STARTING_BALANCE } = require('../../config/config')
const { ec, cryptoHash } = require('../util/elliptic')

/**
 * the Wallet class has the following properties:
 * starting_balance is a given by the system and is
 * config driven.
 * The keyPair is a method of the ec object
 * from the elliptic library. (elliptic curve)
 * the publicKey is the is the hexidecimal
 * emncoding of the ketPair.getPublic method call.
 */
class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE
    this.keyPair = ec.genKeyPair()
    this.publicKey = this.keyPair.getPublic().encode('hex')
  }

  /**
   * acts as a wwrapper for the ec library genKeyPair
   * objects which has a sign method.
   */
  sign(data) {
    return this.keyPair.sign(cryptoHash(data))
  }

  createTransaction({ recipient, amount }) {
    if (amount > this.balance) {
      throw new Error('Amount exceeds balance')
    }

    return new Transaction({ senderWallet: this, recipient, amount })
  }
}

module.exports = Wallet
