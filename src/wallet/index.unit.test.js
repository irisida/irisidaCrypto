const Wallet = require('./index')
const { verifySignature } = require('../util/elliptic')
const Transaction = require('./transaction')
const Blockchain = require('../blockchain/index')
const { STARTING_BALANCE } = require('../../config/config')

describe('Wallet', () => {
  let wallet

  beforeEach(() => {
    wallet = new Wallet()
  })

  it('has a `balance`', () => {
    expect(wallet).toHaveProperty('balance')
  })

  it('has a `publicKey`', () => {
    expect(wallet).toHaveProperty('publicKey')
  })

  describe('signing data', () => {
    const data = 'testsignature'

    it('verifies a signature', () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: wallet.sign(data),
        })
      ).toBe(true)
    })

    it('does not verify an invalid signature', () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data,
          signature: new Wallet().sign(data),
        })
      ).toBe(false)
    })
  })

  describe('createTransaction', () => {
    describe('and the amount exceeds the balance', () => {
      it('throws an error', () => {
        expect(() =>
          wallet.createTransaction({
            amount: 999999,
            recipient: 'dodgy-recipient',
          })
        ).toThrow('Amount exceeds balance')
      })
    })

    describe('and the amount is valid', () => {
      let transaction, amount, recipient

      beforeEach(() => {
        amount = 50
        recipient = 'dodgy-recipient'
        transaction = wallet.createTransaction({ amount, recipient })
      })

      it('creates an instance of `Transaction`', () => {
        expect(transaction instanceof Transaction).toBe(true)
      })

      it('matches the transaction input with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey)
      })

      it('outputs the amount to the recipient', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount)
      })
    })

    describe('and a chain is passed', () => {
      it('calls `Wallet.claculateBalance`', () => {
        const originalCalculateBalance = Wallet.calculateBalance
        const calculateBalanceMock = jest.fn()

        Wallet.calculateBalance = calculateBalanceMock

        wallet.createTransaction({
          recipient: 'testRecipient',
          amount: 50,
          chain: new Blockchain().chain,
        })

        expect(calculateBalanceMock).toHaveBeenCalled()

        Wallet.calculateBalance = originalCalculateBalance
      })
    })
  })

  describe('claculateBalance()', () => {
    let blockchain

    beforeEach(() => {
      blockchain = new Blockchain()
    })

    describe('and there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE`', () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(STARTING_BALANCE)
      })
    })

    describe('and there are outputs for the wallet', () => {
      let transactionOne, transactionTwo

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 50,
        })

        transactionTwo = new Wallet().createTransaction({
          recipient: wallet.publicKey,
          amount: 100,
        })

        blockchain.addBlock({ data: [transactionOne, transactionTwo] })
      })

      it('adds the sum of all the outputs to the wallet balance', () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
          })
        ).toEqual(
          STARTING_BALANCE +
            transactionOne.outputMap[wallet.publicKey] +
            transactionTwo.outputMap[wallet.publicKey]
        )
      })

      describe('and the wallet has made a transaction', () => {
        let recentTransaction

        beforeEach(() => {
          recentTransaction = wallet.createTransaction({
            recipient: 'testRecipient',
            amount: 10,
          })

          blockchain.addBlock({ data: [recentTransaction] })
        })

        it('returns the output amount of the recent transaction', () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey,
            })
          ).toEqual(recentTransaction.outputMap[wallet.publicKey])
        })

        describe('and there are outputs next to and after the recent transaction', () => {
          let sameBlockTransaction, nextBlockTransaction

          beforeEach(() => {
            recentTransaction = wallet.createTransaction({
              recipient: 'laterTestRecipient',
              amount: 25,
            })

            sameBlockTransaction = Transaction.rewardTransaction({
              minerWallet: wallet,
            })

            blockchain.addBlock({
              data: [recentTransaction, sameBlockTransaction],
            })

            nextBlockTransaction = new Wallet().createTransaction({
              recipient: wallet.publicKey,
              amount: 100,
            })

            blockchain.addBlock({ data: [nextBlockTransaction] })
          })

          it('includes the utput amounts in the returned balance', () => {
            expect(
              Wallet.calculateBalance({
                chain: blockchain.chain,
                address: wallet.publicKey,
              })
            ).toEqual(
              recentTransaction.outputMap[wallet.publicKey] +
                sameBlockTransaction.outputMap[wallet.publicKey] +
                nextBlockTransaction.outputMap[wallet.publicKey]
            )
          })
        })
      })
    })
  })
})
