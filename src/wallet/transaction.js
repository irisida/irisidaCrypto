const uuid = require('uuid/v1')
const { verifySignature } = require('../util/elliptic')

/**
 * The transaction class has
 * A unique id (using uuid/v1 is timestamp based)
 * An outputMap
 * A transaction input that includes the:
 * senderWallets original balamce
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

  update({ senderWallet, recipient, amount }) {
    this.outputMap[recipient] = amount
    this.outputMap[senderWallet.publicKey] -= amount

    this.input = this.createInput({ senderWallet, outputMap: this.outputMap })
  }

  static validTransaction(transaction) {
    const { input, outputMap } = transaction
    const { address, amount, signature } = input

    // reduce the outputMap to get a grand total
    const outputTotal = Object.values(outputMap).reduce(
      (total, outputAmount) => total + outputAmount
    )

    // check against the amount in the transaction
    if (amount != outputTotal) {
      console.error(`Invalid transaction from ${address}`)
      return false
    }

    // calls util/verifySignature
    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`)
      return false
    }

    /**
     * checks have passed and the transaction is
     * deemed as a valid case, thereefore true.
     */
    return true
  }
}

module.exports = Transaction
