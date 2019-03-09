/**
 * root of the express server for the blockchain
 * project.
 * creates new instance of express and the Blockchain itself
 * and listen on a port (to be fixed later)
 * url of /api/blocks will fire a get request to haul back
 * the blocks data of the chain.
 */

const express = require('express')
const bodyParser = require('body-parser')
const Blockchain = require('./src/blockchain')
const PubSub = require('./src/PubSub')

const app = express()
const blockchain = new Blockchain()
const pubsub = new PubSub({ blockchain })

setTimeout(() => pubsub.broadcastChain(), 1000)

/**
 * middleware section
 * adds json capabilities.
 */
app.use(bodyParser.json())

/**
 * API get handler for the blockchain blocks.
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
 * create the listener function.
 * The function takes the port and a shring to log to the console
 * the listening status of the application.
 * For multi-node operations on the same machine it will use the
 * peer_port constant to generate a new port number to run the
 * process. This is read from the env, where default is in use
 * a peer will be generated and used. Where a running instance
 * of the default port is not found then it will use the default.
 */

const DEFAULT_PORT = 3000
let PEER_PORT

if (process.env.GENERATE_PEER_PORT === 'true') {
  // gen a random peer port between  3001-4000
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}
const PORT = PEER_PORT || DEFAULT_PORT
app.listen(PORT, () => {
  console.log(`listening at localhost: ${PORT}`)
})
