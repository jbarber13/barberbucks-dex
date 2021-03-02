import {combineReducers} from 'redux';
import { ETHER_ADDRESS } from '../utils';

/***********************************************
 * talks to actions to update state on Redux
 * use web3 for ETH, token for Token, and exchange for Exchange (exchange eth and exchange token balances and trades)
 */


function web3(state = {}, action) {
  switch (action.type) {
  	case 'WEB3_LOADED':
      	return { ...state,  connection: action.connection }
    case 'WEB3_ACCOUNT_LOADED':
    	return { ...state, account: action.account}
    case 'ETHER_BALANCE_LOADED': //not the concern of the exchange, reduce in web3 reducer
      return{...state, balance: action.balance}    
    default:
      return state
  }
}

function token(state = {}, action) {
  switch (action.type) {
    case 'TOKEN_LOADED':
      return { ...state, loaded: true, contract: action.contract }
    case 'TOKEN_BALANCE_LOADED': //token has its own reducer
      return{...state, balance: action.balance}
    default:
      return state
  }
}

function exchange(state = {}, action) {
  let index, data
  switch (action.type) {
    case 'EXCHANGE_LOADED':
      return { ...state, loaded: true, contract: action.contract }
    case 'CANCELLED_ORDERS_LOADED':
      return {...state, cancelledOrders: {loaded: true, data: action.cancelledOrders}}
    case 'FILLED_ORDERS_LOADED':
      return {...state, filledOrders: {loaded: true, data: action.filledOrders}}
    case 'ALL_ORDERS_LOADED':
      return {...state, allOrders: {loaded: true, data: action.allOrders}}
    case 'ORDER_CANCELLING': //cancel is in progress, wait for emit from blockchain to confirm it has been cancelled
      return {...state, orderCancelling: true}
    case 'ORDER_CANCELLED': //cancel event has been emitted from blockchain
      return {
        ...state,
        orderCancelling: false,
        cancelledOrders: {
          ...state.cancelledOrders,
          data: [
            ...state.cancelledOrders.data,
            action.order
          ]
        }
      }
    case 'ORDER_FILLING': //fill is in progress, wait for emit from blockchain to confirm it has been complete
      return {...state, orderFilling: true}
    case 'ORDER_FILLED': //fill event has been emitted from blockchain
      //prevent duplicate orders
      index = state.filledOrders.data.findIndex(order => order.id === action.order.id)

      if(index === -1) {
        data = [...state.filledOrders.data, action.order]
      }else {
        data = state.filledOrders.data
      }
      return {
        ...state,
        orderFilling: false,
        filledOrders: {...state.filledOrders, data}
      }


    case 'EXCHANGE_ETHER_BALANCE_LOADED':
      return{...state, etherBalance: action.balance} 
    case 'EXCHANGE_TOKEN_BALANCE_LOADED':
      return{...state, tokenBalance: action.balance}
    case 'BALANCES_LOADING':
      return{...state, balancesLoading: true} //true for currently loading 
    case 'BALANCES_LOADED':
      return{...state, balancesLoading: false} //true for currently loading   
    case 'ETHER_DEPOSIT_AMOUNT_CHANGED':
      return{...state, etherDepositAmount: action.amount} 
    case 'ETHER_WITHDRAW_AMOUNT_CHANGED':
      return{...state, etherWithdrawAmount: action.amount}
    case 'TOKEN_DEPOSIT_AMOUNT_CHANGED':
      return{...state, tokenDepositAmount: action.amount} 
    case 'TOKEN_WITHDRAW_AMOUNT_CHANGED':
      return{...state, tokenWithdrawAmount: action.amount}
    //MISSION ACCOMPLISHED FOR EXCHANGE BALANCE
    case 'EXCHANGE_BALANCE_UPDATED':      
      let output = {...state, balancesLoading: false}

      //console.log("access wallet balances from state? ", state)


      if(action.event.token === ETHER_ADDRESS) {      
        output = {
          ...state,
          etherBalance: action.event.balance,
          balancesLoading: false,             
        }
      }else{
        output = {
          ...state,
          tokenBalance: action.event.balance,
          balancesLoading: false,      
        }
      }
      return output
    

    case 'BUY_ORDER_AMOUNT_CHANGED':
      return{...state, buyOrder:{...state.buyOrder, amount: action.amount}} 
    case 'BUY_ORDER_PRICE_CHANGED':
      return{...state, buyOrder:{...state.buyOrder, price: action.price}}
    case 'BUY_ORDER_MAKING':
      return{...state, buyOrder:{...state.buyOrder, amount: null, price: null, making: true}}//order currently being made
    case 'SELL_ORDER_AMOUNT_CHANGED':
      return{...state, sellOrder:{...state.sellOrder, amount: action.amount}} 
    case 'SELL_ORDER_PRICE_CHANGED':
      return{...state, sellOrder:{...state.sellOrder, price: action.price}}
    case 'SELL_ORDER_MAKING':
      return{...state, sellOrder:{...state.sellOrder, amount: null, price: null, making: true}}//order currently being made       
    case 'ORDER_MADE':
      //prevent duplicate orders, if all orders already contains the order, don't add anything
      index = state.allOrders.data.findIndex(order => order.id === action.order.id) //determine if the new order (from action varriable) is in state array already
      
      if(index === -1){ 
        data = [...state.allOrders.data, action.order] //new order, state array = state array + new order
      }else{
        data = state.allOrders.data //order already exists, no change
      }
      return{ //og
        ...state, 
        allOrders:{
          ...state.allOrders,
          data
        },
        buyOrder:{
          ...state.buyOrder,
          making: false
        },
        sellOrder:{
          ...state.sellOrder,
          making: false
        }
      }



      



    default:
      return state
  }
}

const rootReducer = combineReducers({
	web3, 
  token,
  exchange
})

export default rootReducer