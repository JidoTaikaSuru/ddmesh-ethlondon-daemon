const Web3 = require('web3');
const { getRevertReason } = require('./revertReason');
const { getStringKey, pushStringToRedisWithKey } = require('../redis');
const { ethers } = require('ethers');
require("dotenv").config();
const {decodeEventData} = require('./decodeEventData');
const {ddmeshABI} = require('./ddmesh.js');

const chainData = {
   421614: {name:"Arbitrum Sepolia", exploreLink: 'https://sepolia.arbiscan.io/', currency: 'ETH'}
}

const runContractListner = async (contractAddress, rpcUrl) => {
const web3 = new Web3(rpcUrl)
const chainId = await web3.eth.getChainId()

const blockNumberRedisKey = `${chainId}_${contractAddress}_block_number`
let blockNumber = parseInt(await getStringKey(blockNumberRedisKey)) 

const waitTime = parseInt(getStringKey(`${chainId}_${contractAddress}_wait_time`)) || process.env.WAIT_TIME // seconds

let previousScannedBlockNumber = null

const networkName = chainData[chainId].name
const exploreLink = chainData[chainId].exploreLink
const currency = chainData[chainId].currency

if(!blockNumber) {
  console.log("No block number found in redis, starting from latest block")
  blockNumber = await web3.eth.getBlockNumber()
}else {
  console.log(`Block number found in redis, starting from block ${blockNumber}`)
}
console.log(`Contract Listner Started for contract ${contractAddress} on chain ${chainId}`)

while(true){
try {
      console.log(`Checking block ${blockNumber}`)
      const getBlock = await web3.eth.getBlock(blockNumber)
      const txs = getBlock.transactions
      // console.log(getBlock)
      async function scanTxs() {
       try {
        if(previousScannedBlockNumber === blockNumber) throw new Error("Already Scanned Txs in this Block, Skipping...")
        console.log(`Scanning Txs in Block ${blockNumber}`)
          for(let i = 0; i < txs.length; i++){
            const tx = await web3.eth.getTransaction(txs[i])
            // console.log(tx)
            if(tx.to === contractAddress){
                const txReceipt = await web3.eth.getTransactionReceipt(txs[i])
                if(txReceipt.status){
                    console.log(`Transaction ${tx.hash} is successful`)
                    console.log(txReceipt)
                    const logs = txReceipt.logs
                    extractEvents(logs)

                }else{
                    console.log(`Transaction ${tx.hash} is failed`)
                    const error = await getRevertReason(rpcUrl, tx.hash)
                }    
            }
          }
          previousScannedBlockNumber = blockNumber
       } catch (error) {
          console.log(error.message)
       }
      }

      scanTxs()
      const currentBlockNumber = await web3.eth.getBlockNumber()
      await pushStringToRedisWithKey(blockNumberRedisKey, blockNumber)
      if(currentBlockNumber > blockNumber) blockNumber++
      else{
          console.log(`No new block found. Waiting for ${waitTime} seconds`)
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
      }
} catch (error) {
    console.log(error)
}

}


}


const extractEvents = async (logs)  => {

    for (const log of logs) {
      try {
        const decodedEventDataForContract = await decodeEventData(ddmeshABI, { data: log.data, topics: log.topics })
        console.log(decodedEventDataForContract)
        if (decodedEventDataForContract.eventName === 'Swapped') {
          console.log('Swapped Event Found', {
            info: decodedEventDataForContract
          })
          
        } 
      } catch (decodeError) {
        console.log(`Not An Error: EventHash ${log.topics[0]} doesn't correspond to Contract, Ignoring!!`, {
          err: decodeError
        })
      }
    }
  }
  


module.exports = {
    runContractListner
}



