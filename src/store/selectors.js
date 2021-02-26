/**************************
 * selectors.js
 * data assigned to Redux store (via reducers.js) needs to be pulled to be accessible to the various app components
 * these selectors must be imported to the appropriate components that requre that data from the redux store * 
*/

import { createSelector } from 'reselect'
import {get, groupBy, reject, maxBy, minBy} from 'lodash'
import{ETHER_ADDRESS, tokens, ether, GREEN, RED, formatBalance} from '../utils.js'
import moment from 'moment'

//web3.account --> reducer.js function.value for that case
const account = state => get(state, 'web3.account')//lodash - provides default value incase null
export const accountSelector = createSelector(account, a => a) //(account) => {return  account})

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w) 

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl) 

const token = state => get(state, 'token.contract')
export const tokenSelector = createSelector(token, t => t) 

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el) 

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e) 

export const contractsLoadedSelector = createSelector(
    tokenLoaded, 
    exchangeLoaded, 
    (tl, el) => (tl && el)
)

const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
//export const allOrdersLoadedSelector = createSelector(allOrdersLoaded, loaded => loaded)

const allOrders = state => get(state, 'exchange.allOrders.data', [])//return empty array if it doesn't exist
//export const allOrdersSelector = createSelector(allOrders, a => a)

const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])//return empty array if it doesn't exist
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

//cancel is in progress, wait for emit from blockchain to confirm it has been cancelled
const orderCancelling = state => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)

//balances
const balancesLoading = state => get(state, 'exchange.balancesLoading', true) //default to TRUE since they will start off not currently loaded
export const balancesLoadingSelector = createSelector(balancesLoading, status => status)

const etherBalance = state => get(state, 'web3.balance', true)//balance comes from web3 for ETH
export const etherBalanceSelector = createSelector(
    etherBalance, 
    balance => {
        //need to format balance into ETH rather than GWEI
        return formatBalance(balance)
    }
)
const tokenBalance = state => get(state, 'token.balance', 0)//default to no token balance, balance comes from Token contract
export const tokenBalanceSelector = createSelector(
    tokenBalance, 
    balance => {
        return formatBalance(balance)
    }
)
const exchangeEtherBalance = state => get(state, 'exchange.etherBalance', 0)//exchange contract
export const exchangeEtherBalanceSelector = createSelector(
    exchangeEtherBalance, 
    balance => {
        return ether(balance)
    }
)
const exchangeTokenBalance = state => get(state, 'exchange.tokenBalance', 0)//exchange contract
export const exchangeTokenBalanceSelector = createSelector(
    exchangeTokenBalance, 
    balance => {
        return formatBalance(balance)
    }
)

const etherDepositAmount = state => get(state, 'exchange.etherDepositAmount', null)
export const etherDepositAmountSelector = createSelector(etherDepositAmount, amount => amount)

const etherWithdrawAmount = state => get(state, 'exchange.etherWithdrawAmount', null)
export const etherWithdrawAmountSelector = createSelector(etherWithdrawAmount, amount => amount)

const tokenDepositAmount = state => get(state, 'exchange.tokenDepositAmount', null)
export const tokenDepositAmountSelector = createSelector(tokenDepositAmount, amount => amount)

const tokenWithdrawAmount = state => get(state, 'exchange.tokenWithdrawAmount', null)
export const tokenWithdrawAmountSelector = createSelector(tokenWithdrawAmount, amount => amount)




const buyOrder = state => get(state, 'exchange.buyOrder', {})
export const buyOrderSelector = createSelector(buyOrder, order => order)

const sellOrder = state => get(state, 'exchange.sellOrder', {})
export const sellOrderSelector = createSelector(sellOrder, order => order)







//fill is in progress, wait for emit from blockchain to confirm it has been filled
const orderFilling = state => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector = createSelector(orderFilling, status => status)

const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])//return empty array if it doesn't exist
export const filledOrdersSelector = createSelector(
    filledOrders,
    (orders) => {
        //sort orders by date acending for price comparison
        orders = orders.sort((a,b) => a.timeStamp - b.timeStamp)
        //decorate orders
        orders = decorateFilledOrders(orders)
        //sort orders by date decending 
        orders = orders.sort((a,b) => b.timeStamp - a.timeStamp)
        //console.log(orders)

        return orders
    }
)

const decorateFilledOrders = (orders) => {
    //track previous order
    let previousOrder = orders[0]
    return(
        orders.map((order) =>{
            order = decorateOrder(order)
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order //update previous order once its decorated
            return order
        })
    )
}

const decorateOrder = (order) => {
    let etherAmount
    let tokenAmount

    //if tokenGive is ether address, use eth amount
    if(order.tokenGive === ETHER_ADDRESS){
        etherAmount = order.amountGive
        tokenAmount = order.amountGet
    }else{
        etherAmount = order.amountGet
        tokenAmount = order.amountGive
    }
    
    //calculate token price to 5 decimal places 
    const precision = 100000
    let tokenPrice = (etherAmount / tokenAmount) //ether per token rate
    tokenPrice = Math.round(tokenPrice * precision) / precision

    return({
        ...order,
        etherAmount: ether(etherAmount), 
        tokenAmount: tokens(tokenAmount),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timeStamp).format('h:mm:ss a M/D/Y') //hours mins seconds AM/PM Month/Day/Year -- https://momentjs.com/
    })
}

const decorateFilledOrder = (order, previousOrder) => {
    return({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    })
}
const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    //show green price text if order price > previous order
    //show red vice versa

    //default to GREEN for first order or if no previous orders    
    if(previousOrder.id === orderId){
        return GREEN
    }

    if(previousOrder.tokenPrice <= tokenPrice){
        return GREEN //success
    }else{
        return RED //danger
    }
}


const openOrders = state => {
    const all = allOrders(state)
    const cancelled = cancelledOrders(state)
    const filled = filledOrders(state)

    const openOrders = reject(all, (order) => { //lodash
        const orderFilled = filled.some((o) => o.id === order.id) //reject filled orders --> not an open order
        const orderCancelled = cancelled.some((o) => o.id === order.id)//reject cancelled orders --> not an open order
        return(orderFilled || orderCancelled)
    })

    return openOrders
}

//order book is calculated based on all orders - cancelled orders & filled orders
const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)


//create order book
export const orderBookSelector = createSelector(
    openOrders,
    (orders) => {
        //decorate orders
        orders = decorateOrderBookOrders(orders)
        
        //group orders by type
        orders = groupBy(orders, 'orderType')//lodash, type comes from decorateOrderBookOrder()

        //fetch buy orders
        const buyOrders = get(orders, 'buy', [])//return empty array as default
        //sort buy orders by price
        orders = {
            ...orders, 
            buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
        }

        //fetch sell orders
        const sellOrders = get(orders, 'sell', [])//return empty array as default
        //sort sell orders by price
        orders = {
            ...orders, 
            sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
        }

        return orders
    }
)
const decorateOrderBookOrders = (orders) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateOrderBookOrder(order)
            return(order)
        })
    )
}
const decorateOrderBookOrder = (order) => {
    const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED), //if order type is buy its GREEN, if not its RED
        orderFillAction: orderType === 'buy' ? 'sell' : 'buy'

    })
}

//My Transactions
export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)
export const myFilledOrdersSelector = createSelector(
    account, 
    filledOrders,
    (account, orders) => {
        //find our orders
        orders = orders.filter((o) => o.user === account || o.userFill === account)
        //sort by date asc
        orders = orders.sort((a,b) => a.timeStamp - b.timeStamp)
        //decorate orders 
        orders = decorateMyFilledOrders(orders, account)
        return orders
    }
)
const decorateMyFilledOrders = (orders, account) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyFilledOrder(order)
            return(order)
        })
    )
}
const decorateMyFilledOrder = (order, account) => {
    const myOrder = order.user === account
    let orderType
    if(myOrder){
        orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
    }else{
        orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
    }
    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED), //if order type is buy its GREEN, if not its RED
        orderSign: orderType === 'buy' ? '+' : '-'

    })
}
export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)
export const myOpenOrdersSelector = createSelector(
    account, 
    openOrders,
    (account, orders) => {
        //find our orders - orders created by current account
        orders = orders.filter((o) => o.user === account)
        //decorate orders 
        orders = decorateMyOpenOrders(orders)
        //sort by date dsc
        orders = orders.sort((a,b) => b.timeStamp - a.timeStamp)
        return orders 
        
    }
)
const decorateMyOpenOrders = (orders) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyOpenOrder(order, account)
            return(order)
        })
    )
}
const decorateMyOpenOrder = (order, account) => {
    let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED)
    })
    
}

//Price Chart
export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)
export const priceChartSelector = createSelector(
    filledOrders, 
    (orders) => {
        //sort by date asc
        orders = orders.sort((a,b) => a.timeStamp - b.timeStamp)
        //decorate orders
        orders = orders.map((o) => decorateOrder(o))

        //get last 2 orders for final price / price change
        let secondLastOrder, lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length -2, orders.length)//parallel assignment
        //get last price
        const lastPrice = get(lastOrder, 'tokenPrice', 0)//price or 0 by default
        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)//price or 0 by default
        
        return({
            lastPrice, 
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),            
            series: [{
                data: buildGraphData(orders)
            }]
        })
    }
)
const buildGraphData = (orders) => {
    // group by hour, using lodash and moment
    orders = groupBy(orders, (o) => moment.unix(o.timeStamp).startOf('hour').format())
    //get each hour where data exists
    const hours = Object.keys(orders)
    //build graph series
    const graphData = hours.map((hour) => {
        //fetch all orders from current hour
        const group = orders[hour]//orders in a 1 hour period 
        //calculate open high low and close
        const open = group[0]//first order
        const high = maxBy(group, 'tokenPrice')//high price - lodash
        const low = minBy(group, 'tokenPrice')//min price - lodash
        const close = group[group.length -1]//last order
        
        return ({
            x: new Date(hour),
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })
    return graphData
}



