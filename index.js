/**
 * root of the express server for the blockchain
 * project.
 * creates new instance of express and the Blockchain itself
 * and listen on a port (to be fixed later).
 */

const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const Blockchain = require('./src/blockchain/index')
const PubSub = require('./src/app/pubsub')
const TransactionPool = require('./src/wallet/transaction-pool')
const Wallet = require('./src/wallet/index')
const TransactionMiner = require('./src/app/transaction-miner')

const app = express()
const blockchain = new Blockchain()
const transactionPool = new TransactionPool()
const wallet = new Wallet()
const pubsub = new PubSub({ blockchain, transactionPool })
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub,
})

const DEFAULT_PORT = 3000
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

/**
 * middleware section
 * adds json capabilities.
 */
app.use(bodyParser.json())

/**
 * url of /api/blocks will fire a get request to haul back
 * the blocks data of the chain.
 */
app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain)
})

/**
 * API post handler for submitting a new block to the
 * blockchain. It will take the data of a block from the
 * body of the request object and add a new block to the
 * chain. It then calls the pubsub.broadcastChain so that
 * all listening peer nodes can receive the new updated
 * blockchain.
 */
app.post('/api/mine', (req, res) => {
  const { data } = req.body

  blockchain.addBlock({ data })

  pubsub.broadcastChain()

  res.redirect('/api/blocks')
})

/**
 * API post handler for adding a new transaction.
 * The body of the request is destructured to obtain
 * the amount and recipient.
 * The transaction is then set to the result of a check
 * against the senderWallet.publicKey to determine if
 * an existing transaction is found. If found then the
 * transaction is updated. If not then a new transaction
 * is created.
 * In the event a new transaction was created it is then
 * added to the transactionPool.
 */
app.post('/api/transact', (req, res) => {
  const { amount, recipient } = req.body

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  })

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount })
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      })
    }
  } catch (error) {
    return res.status(400).json({ type: 'error', message: error.message })
  }

  transactionPool.setTransaction(transaction)

  pubsub.broadcastTransaction(transaction)

  res.json({ type: 'success', transaction })
})

/**
 * get handler for the transacationPoolMap
 */
app.get('/api/transaction-pool-map', (req, res) => {
  res.json(transactionPool.transactionMap)
})

/**
 * get handler for the mining of transactions
 */
app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions()

  res.redirect('/api/blocks')
})

/**
 *
 */
app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey

  res.json({
    address,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address,
    }),
  })
})

/**
 * syncWithRootState
 * Function allows new nodes on the network to sync
 * with the root node which will have the latest/longest
 * verson of the chain.
 *
 * it will also set the transactionPoolMap data.
 */
const syncWithRootState = () => {
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body)

        console.log('replace chain on a sync with ', rootChain)
        blockchain.replaceChain(rootChain)
      }
    }
  )

  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body)

        console.log(
          'replace tranasctionPoolMap on a sync with',
          rootTransactionPoolMap
        )
        // set as the new transactionPoolMap data
        transactionPool.setMap(rootTransactionPoolMap)
      }
    }
  )
}

/**
 * create the listener function.
 * The function takes the port and a shring to log to the console
 * the listening status of the application.
 * For multi-node operations on the same machine it will use the
 * peer_port constant to generate a new port number to run the
 * process. This is read from the env, where default is in use
 * a peer will be generated and used. Where a running instance
 * of the default port is not found then it will use the default.
 */
let PEER_PORT

if (process.env.GENERATE_PEER_PORT === 'true') {
  // gen a random peer port between  3001-4000
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}
const PORT = PEER_PORT || DEFAULT_PORT
app.listen(PORT, () => {
  console.log(`listening at localhost: ${PORT}`)

  /**
   * Check that we are not the root node and where it
   * confrms that the node is a peer node then call
   * the syncChains function to ensure that the node
   * receives the latest/longest version of the
   * verified chain from the rootNode.
   */
  if (PORT !== DEFAULT_PORT) {
    syncWithRootState()
  }
})
