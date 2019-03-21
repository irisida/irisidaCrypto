const uuid = require('uuid/v1')
const { verifySignature } = require('../util/elliptic')
const { REWARD_INPUT, MINING_REWARD } = require('../../config/config')

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
  constructor({ senderWallet, recipient, amount, outputMap, input }) {
    this.id = uuid()
    this.outputMap =
      outputMap || this.createOutputMap({ senderWallet, recipient, amount })
    this.input =
      input || this.createInput({ senderWallet, outputMap: this.outputMap })
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

  /**
   * The update function is required to take care
   * of the following cases:
   * If the anount in the update exceeds the senderWallet
   * balance then an error is thrown.
   * If the recipient of the update does not exist in the
   * output map it should be added and for tha amount that
   * was passed.
   * If the recipient was already found in the outputMap
   * then the amount is added to the existing amount for
   * that recipient.
   * The update should also ensure that the senderwallet
   * publickKey(ie remaining balance) has had the amount
   * value subtracted.
   * It will then cll the createInput method which will
   * provide a timestamp, new senderwallet balance, a
   * publicKey and a signature which is a signed outputMap
   */
  update({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds balance')
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount
    } else {
      this.outputMap[recipient] += amount
    }

    this.outputMap[senderWallet.publicKey] -= amount

    this.input = this.createInput({ senderWallet, outputMap: this.outputMap })
  }

  /**
   * performs some transaction checks to ensure
   * that the operation amount is the same value
   * as the outputTotal, this validates the
   * transaction.
   * The second check is to ensure the transaction
   * has a valid signature. This relies on the
   * verifySignature method from the util library.
   */
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
     * positive and valid transaction by this stage.
     * checks have passed and as such the transaction
     * is deemed as a valid case, thereefore true.
     * we return with true in this event.
     */
    return true
  }

  static rewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD },
    })
  }
}

module.exports = Transaction
