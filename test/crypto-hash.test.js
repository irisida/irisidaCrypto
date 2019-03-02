const cryptoHash = require('../src/crypto-hash')

describe('cryptoHash()', () => {
  it('geneates a SHA-256 hashed output', () => {
    expect(cryptoHash('irisida')).toEqual(
      'd234231cff48973ee8fd1aa8e13cf058e052873965f190b59dd664539fedccd3'
    )
  })

  it('produces the same hash with arguments in any order', () => {
    expect(cryptoHash('one', 'two', 'three')).toEqual(
      cryptoHash('three', 'one', 'two')
    )
  })
})
