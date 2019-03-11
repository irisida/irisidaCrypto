const Blockchain = require('../blockchain/blockchain')

const blockchain = new Blockchain()
blockchain.addBlock({ data: 'initialBlock' })

let prevTimestamp, nextTimestamp, nextBlock, timeDifference, average

const times = []

for (let i = 0; i < 10000; i++) {
  prevTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp

  blockchain.addBlock({ data: `block ${i}` })

  nextBlock = blockchain.chain[blockchain.chain.length - 1]
  nextTimestamp = nextBlock.timestamp
  timeDifference = nextTimestamp - prevTimestamp

  times.push(timeDifference)

  average = times.reduce((total, num) => total + num) / times.length

  console.log(
    `Time to mine Block: ${timeDifference}ms. Difficulty: ${
      nextBlock.difficulty
    }. Average time: ${average}ms.`
  )
}
