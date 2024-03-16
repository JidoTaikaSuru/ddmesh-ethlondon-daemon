
const ethers = require('ethers')

function hex_to_ascii(str1) {
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
 }

async function getRevertReason(rpcUrl, hash) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    let tx = await provider.getTransaction(hash)
    if (!tx) {
        console.log('tx not found')
    } else {
        try {
            tx.gasPrice = 100000000000
            let code = await provider.call(tx, tx.blockNumber)
            console.log(code)
            let reason = hex_to_ascii(code.substr(138))
            console.log('Revert Reason:', reason)
            return reason
        } catch (error) {
            return "COULD_NOT_DECODE_ERROR"
        }
    }
}


module.exports = {
    getRevertReason
}