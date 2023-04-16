const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
  const milliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}



async function main() {

  const accounts = await ethers.getSigners()

  const { chainId } = await ethers.provider.getNetwork()
  console.log("Using chainID", chainId)


  const Prince = await ethers.getContractAt('Token', config[chainId].Prince.address)
  console.log(`Token fetched: ${Prince.address}\n`)

  const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
  console.log(`Token fetched: ${mETH.address}\n`)

  const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
  console.log(`Token fetched: ${mDAI.address}\n`)

  const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
  console.log(`Exchange fetched: ${exchange.address}\n`)

  // Give tokens to account[1]
  const sender = accounts[0]
  const receiver = accounts[1]
  let amount = tokens(10000)

  // user1 transfers 10,000 mETH...
  let transaction, result
  transaction = await mETH.connect(sender).transfer(receiver.address, amount)
  console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

  // Set up exchange users
  const user1 = accounts[0]
  const user2 = accounts[1]
  amount = tokens(10000)

  transaction = await Prince.connect(user1).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`Approved ${amount} tokens from ${user1.address}`)

  transaction = await exchange.connect(user1).depositToken(Prince.address, amount)
  await transaction.wait()
  console.log(`Deposited ${amount} Ether from ${user1.address}\n`)

  transaction = await mETH.connect(user2).approve(exchange.address, amount)
  await transaction.wait()
  console.log(`Approved ${amount} tokens from ${user2.address}`)

  transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
  await transaction.wait()
  console.log(`Deposited ${amount} tokens from ${user2.address}\n`)

  let orderId
  transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), Prince.address, tokens(5))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  orderId = result.events[0].args.id
  transaction = await exchange.connect(user1).cancelOrder(orderId)
  result = await transaction.wait()
  console.log(`Cancelled order from ${user1.address}\n`)

  await wait(1)

  transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), Prince.address, tokens(10))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  await wait(1)

  transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), Prince.address, tokens(15))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  await wait(1)

  transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), Prince.address, tokens(20))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  orderId = result.events[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  await wait(1)

  // User 1 makes 10 orders
  for(let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), Prince.address, tokens(10))
    result = await transaction.wait()

    console.log(`Made order from ${user1.address}`)

    // Wait 1 second
    await wait(1)
  }

  // User 2 makes 10 orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user2).makeOrder(Prince.address, tokens(10), mETH.address, tokens(10 * i))
    result = await transaction.wait()

    console.log(`Made order from ${user2.address}`)

    // Wait 1 second
    await wait(1)
  }

}
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
