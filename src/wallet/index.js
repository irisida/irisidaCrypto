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

  /**
   * Simple createTransaction method that checks
   * if a transaction amount exceeds the balance
   * and if it is not exceeded it then creates
   * a new transaction.
   */
  createTransaction({ recipient, amount }) {
    if (amount > this.balance) {
      throw new Error('Amount exceeds balance')
    }

    return new Transaction({ senderWallet: this, recipient, amount })
  }

  /**
   * claculateBalance should
   * check the entire chain looking for
   * outputs for the address and add
   * them to the running total.
   * Needs bolstering
   */
  static calculateBalance({ chain, address }) {
    let outputsTotal = 0

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i]

      for (let transaction of block.data) {
        const addressOutput = transaction.outputMap[address]

        if (address) {
          outputsTotal += addressOutput
        }
      }
    }

    return STARTING_BALANCE + outputsTotal
  }
}

module.exports = Wallet
