const EC = require('elliptic').ec
const cryptoHash = require('./crypto-hash')

const ec = new EC('secp256k1')

/**
 * To verify a siganture we gather the keyFromPublic
 * which accepts the hex of the publicKey. We then call
 * the underlying verify method with a cryptoHash of
 * the data and signature, again this returns a hex
 * so that the verify then will return a true or false, or
 * verified, unverified and therefore valid or invalid.
 */
const verifySignature = ({ publicKey, data, signature }) => {
  const keyFromPublic = ec.keyFromPublic(publicKey, 'hex')

  return keyFromPublic.verify(cryptoHash(data), signature)
}

module.exports = {
  ec,
  verifySignature,
}
