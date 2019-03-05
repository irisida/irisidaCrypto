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

const app = express()
const blockchain = new Blockchain()

/**
 * middleware section
 * adds json capabilities.
 */
app.use(bodyParser.json())

/**
 * API get handler for the blockchain blocks
 */
app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain)
})

/**
 * API post handler for submitting a new block
 * to the blockchain.
 */
app.post('/api/mine', (req, res) => {
  const { data } = req.body

  blockchain.addBlock({ data })

  res.redirect('/api/blocks')
})

/**
 * create the listener function. The function takes the
 * port and a shring to log to the console the listening
 * status of the application.
 */
const PORT = 3000
app.listen(PORT, () => {
  console.log(`listening at localhost: ${PORT}`)
})
