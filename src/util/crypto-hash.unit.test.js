const cryptoHash = require('./crypto-hash')

describe('cryptoHash()', () => {
  it('geneates a SHA-256 hashed output', () => {
    expect(cryptoHash('irisida')).toEqual(
      'bda43d7a0f2d824d662ffe78c910a153c3ae517d093f22be96da57adccea63c7'
    )
  })

  it('produces the same hash with arguments in any order', () => {
    expect(cryptoHash('one', 'two', 'three')).toEqual(
      cryptoHash('three', 'one', 'two')
    )
  })

  it('produces a unique hash when the properties have changed on an input', () => {
    const testObj = {}
    const originalHash = cryptoHash(testObj)
    testObj['newProp'] = 'newProp'

    expect(cryptoHash(testObj)).not.toEqual(originalHash)
  })
})
