/**
 * passes data from app components to actions.js and to blockchain where applicable
 */

import Web3 from 'web3'
import {
	web3Loaded, 
	web3AccountLoaded,
	tokenLoaded,
  exchangeLoaded,
  cancelledOrdersLoaded,
  filledOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  orderFilling, 
  orderFilled,
  etherBalanceLoaded,
  tokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  exchangeTokenBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade,
  exchangeBalanceUpdated
  } from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import {ETHER_ADDRESS} from '../utils'



export const loadWeb3 = async (dispatch) => {

  if(typeof window.ethereum!=='undefined'){
    const web3 = new Web3(window.ethereum)
    dispatch(web3Loaded(web3))
    window.ethereum.enable(); //REQUIRED FOR INITIAL MetaMask connection

    return web3
  } else {
    window.alert('Please install MetaMask')
    window.location.assign("https://metamask.io/")
  }
}

export const loadAccount = async (web3, dispatch) => {
  const accounts = await web3.eth.getAccounts()
  const account = await accounts[0]
  if(typeof account !== 'undefined'){
    dispatch(web3AccountLoaded(account))
    return account
  } else {
    window.alert('Please login with MetaMask, if you just logged in, refresh the page')
    return null
  }
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
    const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    //console.log("loadToken", token)//debug
    dispatch(tokenLoaded(token))
    return token
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select the Kovan network with Metamask.')
    return null
  }
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
    //console.log("loadExchange", exchange)//debug
    dispatch(exchangeLoaded(exchange))
    return exchange
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadAllOrders = async (exchange, dispatch) => {
  //fetch canceled orders with 'Cancel' event stream
  //need exchange selector, map state to props in Content.js
  const cancelStream = await exchange.getPastEvents('Cancel', {fromBlock: 0, toBlock: 'latest'})//look on entire blockchain  
  //format
  const cancelledOrders = cancelStream.map((event) => event.returnValues)
  //add canceled order to redux store
  //import from actions.js
  dispatch(cancelledOrdersLoaded(cancelledOrders))

  //fetch filled orders with the 'Trade' event stream
  const tradeStream = await exchange.getPastEvents('Trade', {fromBlock: 0, toBlock: 'latest'})//look on entire blockchain  
  //format
  const filledOrders = tradeStream.map((event) => event.returnValues)
   //add canceled order to redux store
  //import from actions.js
  dispatch(filledOrdersLoaded(filledOrders))

  //fetch all oerders with 'Order' event stream
  const orderStream = await exchange.getPastEvents('Order', {fromBlock: 0, toBlock: 'latest'})//look on entire blockchain  
  //console.log("LoadAllOrders: ", orderStream)
  //format
  const allOrders = orderStream.map((event) => event.returnValues)
   //add canceled order to redux store
  //import from actions.js
  dispatch(allOrdersLoaded(allOrders))


  //calculate open orders 
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  if(typeof account !== 'undefined') {
    // Ether balance in wallet
    const etherBalance = await web3.eth.getBalance(account)
    dispatch(etherBalanceLoaded(etherBalance))

    // Token balance in wallet
    const tokenBalance = await token.methods.balanceOf(account).call()
    dispatch(tokenBalanceLoaded(tokenBalance))

    // Ether balance in exchange
    const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
    dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

    // Token balance in exchange
    const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
    dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

    // Trigger all balances loaded
    dispatch(balancesLoaded())
  } else {
    window.alert('Please login with MetaMask')
  }
}




const _loadWalletBalances = async (event, dispatch) => {
  
  //these calls are mostly redundant, I tried to reuse the functions above without success, the data might be able to be pulled from state but it does not seem to impact performance at this time
  const account = event.returnValues[1]    
  const web3 = new Web3(window.ethereum)
  const etherBalance = await web3.eth.getBalance(account)
  const networkId = await web3.eth.net.getId()
  const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
  const tokenBalance = await token.methods.balanceOf(account).call()

  dispatch(etherBalanceLoaded(etherBalance))
  dispatch(tokenBalanceLoaded(tokenBalance))
}

//listen for events emitted from contract and update component in real time
export const subscribeToEvents = async (exchange, dispatch) => {
  exchange.events.Cancel({}, (error, event) => {
    dispatch(orderCancelled(event.returnValues)) //add canceled order to redux data
  })
  exchange.events.Trade({}, (error, event) => {
    dispatch(orderFilled(event.returnValues))
  })
  exchange.events.Deposit({}, (error, event) => {    
    _loadWalletBalances(event, dispatch)//load balances for account heard in emit, some redundant code here......
    dispatch(exchangeBalanceUpdated(event.returnValues)) //This updates the exchange balances with the values from the contract event once emmitted
  })
  exchange.events.Withdraw({}, (error, event) => {
    _loadWalletBalances(event, dispatch)//load balances for account heard in emit, some redundant code here......
    dispatch(exchangeBalanceUpdated(event.returnValues)) //This updates the exchange balances with the values from the contract event once emmitted
  })
  exchange.events.Order({}, (error, event) => {
    dispatch(orderMade(event.returnValues)) 
  })
}

//call cancel order on exchange contract
export const cancelOrder = (dispatch, exchange, order, account) => {
  //use data from redux - https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#methods-mymethod-send
  exchange.methods.cancelOrder(order.id).send({from: account})//This is the call to contract funtion in Solidity
  .on('transactionHash', (hash) =>{
    //dispatch to redux to display on app
    dispatch(orderCancelling())//cancel is in progress, wait for emit from blockchain to confirm it has been cancelled
    console.log("Cancel Order Transaction Hash: ", hash)
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error while cancelling')
  })

}
//fill order on exchange contract
export const fillOrder = (dispatch, exchange, order, account) => {

  
    //use data from redux - https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#methods-mymethod-send
    exchange.methods.fillOrder(order.id).send({from: account})//This is the call to contract funtion in Solidity
    .on('transactionHash', (hash) =>{
      //dispatch to redux to display on app
      dispatch(orderFilling())//fill is in progress, wait for emit from blockchain to confirm it has been cancelled
      console.log("Fill Order Transaction Hash: ", hash)
    })
    .on('error', (error) => {
      console.log(error)
      window.alert('There was an error while filling')
    })

  }

 


//deposit ether to exchange contract
export const depositEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.depositEther().send({ from: account,  value: web3.utils.toWei(amount, 'ether') })//This is the call to contract funtion in Solidity
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())//actions.js
    console.log("Deposit Ether Transaction Hash: ", hash)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error while depositing ETH`)
  })
}
export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account})//This is the call to contract funtion in Solidity
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())//actions.js
    console.log("Withdraw Ether Transaction Hash: ", hash)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error while withdrawing ETH`)
  })
}

//TOKENS - 2 step process: approve then send
export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')

  token.methods.approve(exchange.options.address, amount).send({from: account})
  .on('transactionHash', (hash) => {
    exchange.methods.depositToken(token.options.address, amount).send({from: account})
      .on('transactionHash', (hash) => {
        dispatch(balancesLoading())//actions.js
        console.log("Deposit Token Transaction Hash: ", hash)
      })    
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error while depositing BB`)
    })
  })
}
export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  console.log("WithdrawToken amount: ", amount)
  if(amount != null){
    amount = web3.utils.toWei(amount, 'ether')
    exchange.methods.withdrawToken(token.options.address, amount).send({ from: account})//This is the call to contract funtion in Solidity
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())//actions.js
      console.log("Withdraw Token Transaction Hash: ", hash)
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error while withdrawing BB`)
    })  
  }else{window.alert(`WithdrawToken amount is null`)}
  

  
}

/**Make Orders */
//buy order --> tokenGive is always ETH and token get is always token
export const makeBuyOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = token.options.address
  const amountGet = web3.utils.toWei(order.amount, 'ether')
  const tokenGive = ETHER_ADDRESS
  const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether')

  //This is the call to contract funtion in Solidity
  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({from: account})
  .on('transactionHash', (hash) => {
    dispatch(buyOrderMaking())//actions.js
    console.log("Buy Order Making Transaction Hash: ", hash)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error while making a buy order`)
  })
}

//sell order --> tokenGive is always Token and token get is always ETH
export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = ETHER_ADDRESS
  const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether')
  const tokenGive = token.options.address
  const amountGive = web3.utils.toWei(order.amount, 'ether')

  //This is the call to contract funtion in Solidity
  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({from: account})
  .on('transactionHash', (hash) => {
    dispatch(sellOrderMaking())//actions.js
    console.log("Sell Order Making Transaction Hash: ", hash)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error while making a sell order`)
  })
}
