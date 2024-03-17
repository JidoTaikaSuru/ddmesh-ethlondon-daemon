const Web3 = require('web3');
const { getRevertReason } = require('./revertReason');
const { getStringKey, pushStringToRedisWithKey } = require('../redis');
const { ethers } = require('ethers');
require("dotenv").config();
const {decodeEventData} = require('./decodeEventData');
const {ddmeshABI, ddmeshContractAddress} = require('./ddmesh.js');
const { NeonManagementApiClient, BASE_URL } = require('../dbConnecters/index.js');

const chainData = {
   421614: {name:"Arbitrum Sepolia", exploreLink: 'https://sepolia.arbiscan.io/', currency: 'ETH'},
   82554: {name:"DD MESH NETWORK", exploreLink: ' https://explorerl2new-dd-mesh-4ulujj9fnb.t.conduit.xyz/', currency: 'ETH'}
}



const runContractListner = async (contractAddress, rpcUrl) => {
const web3 = new Web3(rpcUrl)
const chainId = await web3.eth.getChainId()
const provider = new ethers.providers.WebSocketProvider(rpcUrl);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

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
        // console.log(`Scanning Txs in Block ${blockNumber}`)
        console.time()
        for(let i = 0; i < txs.length; i++){

            const findTx = async () => {
              const tx = await web3.eth.getTransaction(txs[i])
              // console.log(tx)
              if(tx.to === contractAddress){
                  const txReceipt = await web3.eth.getTransactionReceipt(txs[i])
                  if(txReceipt.status){
                      console.log(`Transaction ${tx.hash} is successful`)
                      console.log(txReceipt)
                      const logs = txReceipt.logs
                      extractEvents(logs, wallet)

                  }else{
                      console.log(`Transaction ${tx.hash} is failed`)
                      const error = await getRevertReason(rpcUrl, tx.hash)
                  }    
              }
            }

            findTx()

          }
          console.timeEnd()

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
          // console.log(`No new block found. Waiting for ${waitTime} seconds`)
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
      }
} catch (error) {
    console.log(error)
}

}


}


const extractEvents = async (logs, wallet)  => {

    for (const log of logs) {
      try {
        const decodedEventDataForContract = await decodeEventData(ddmeshABI, { data: log.data, topics: log.topics })
        console.log(decodedEventDataForContract)
        if (decodedEventDataForContract.eventName === 'AgreementCreated') {
          console.log('Agreement Created Info Found!', {
            info: decodedEventDataForContract
          })

          const API_KEY = decodedEventDataForContract.encApiKey
          const neon = new NeonManagementApiClient(BASE_URL, API_KEY)
          const dbName = "dd-mesh-" + decodedEventDataForContract.userAddress
          console.log("CREATING DATABASE-> ")
          const db = await neon.createDatabase(dbName)
          console.log("CONNECTION STRING-> ", db.database.connectionString)
          const contract = new ethers.Contract(ddmeshContractAddress, ddmeshABI, wallet);

          const result = await contract.setConnectionStringAndActivateAgreement(decodedEventDataForContract.agreementId, db.database.connectionString);
          const tx = await result.wait()
          console.log('Result:', tx);
          
        } 

        if (decodedEventDataForContract.eventName === 'AgreementClosed') {
          console.log('Agreement Close Info Found!', {
            info: decodedEventDataForContract
          })

          const API_KEY = decodedEventDataForContract.encApiKey
          const neon = new NeonManagementApiClient(BASE_URL, API_KEY)
          console.log("Deleting DATABASE-> ")
          const projectId = await neon.getFirstProjectId()
          const branchId = await neon.getFirstBranchId(projectId)
          const dbName = "dd-mesh-" + decodedEventDataForContract.userAddress
          const db = await neon.deleteDatabase(dbName, projectId, branchId)
          console.log("DATABASE DELETED-> ", db)
        } 
      } catch (decodeError) {
        console.log(decodeError)
        // console.log(`Not An Error: EventHash ${log.topics[0]} doesn't correspond to Contract, Ignoring!!`, {
        //   err: decodeError
        // })
      }
    }
  }
  


module.exports = {
    runContractListner
}



