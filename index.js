/**
 * root of the express server for the blockchain
 * project.
 * creates new instance of express and the Blockchain itself
 * and listen on a port (to be fixed later)
 * url of /api/blocks will fire a get request to haul back
 * the blocks data of the chain.
 */

const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const Blockchain = require('./src/blockchain/blockchain')
const PubSub = require('./src/app/pubsub')

const app = express()
const blockchain = new Blockchain()
const pubsub = new PubSub({ blockchain })

const DEFAULT_PORT = 3000
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

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
 * syncChains
 * Functions allows new nodes to the network to sync
 * with the root node which will have the latest/longest
 * verson of the chain.
 */
const syncChains = () => {
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
    syncChains()
  }
})
