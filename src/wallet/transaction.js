const uuid = require('uuid/v1')

/**
 * The transaction class has
 * A unique id (using uuid/v1 is timestamp based)
 * An outputMap
 * A transaction input that includes the:
 * senderWaallets original balamce
 * publicKey and signature.
 * Input is required for other users to be able to
 * verify that a transaction is valid. an input
 * should be built from:
 * a timestamp
 * an amount - the senderWallet.balance
 * an address - the senderWallet.publicKey
 * a signature - senderWallet.sign(outputMap)
 */
class Transaction {
  constructor({ senderWallet, recipient, amount }) {
    this.id = uuid()
    this.outputMap = this.createOutputMap({ senderWallet, recipient, amount })
    this.input = this.createInput({ senderWallet, outputMap: this.outputMap })
  }

  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {}

    outputMap[recipient] = amount
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount

    return outputMap
  }

  createInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap),
    }
  }
}

module.exports = Transaction
