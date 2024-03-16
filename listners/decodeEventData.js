const ethers = require('ethers')

const decodeEventData = async (abi, event) => {
  const iface = new ethers.utils.Interface(abi)
  const eventData = iface.parseLog(event)
  const parsed = await parseEtherjsLog(eventData)
  return { eventName: eventData.name, ...parsed }
}

const parseEtherjsLog = async (parsed) => {
  const parsedEvent = {}
  for (let i = 0; i < parsed.args.length; i++) {
    const input = parsed.eventFragment.inputs[i]
    let arg = parsed.args[i]
    if (typeof arg === 'object' && arg._isBigNumber) {
      arg = arg.toString()
    }
    parsedEvent[input.name] = arg
  }
  return parsedEvent
}

module.exports = {
  decodeEventData
}
