//Used for client side, no Web3

export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

export const GREEN = 'success'
export const RED = 'danger'

export const DECIMALS = (10**18)

export const ether = (wei) => {
	if(wei){
        return(wei / DECIMALS) //18 decimal places
    }
}

//used in selectors.js
export const formatBalance = (balance) => {
	let precision = 1000 //use 3 decimal places
	balance = ether(balance) //convert to ETH value
	balance = Math.round(balance * precision) / precision 
	return balance
}

export const tokens = (n) => ether(n) //same as ether

export const EVM_REVERT = 'VM Exception while processing transaction: revert'

export const wait = (seconds) => {
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const getBalance = (address, token) => {
	
}