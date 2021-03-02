import React, { Component } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import {
    exchangeSelector,
    accountSelector,
    orderBookSelector,
    orderBookLoadedSelector,
    orderFillingSelector, 
    exchangeEtherBalanceSelector, 
    exchangeTokenBalanceSelector
}from '../store/selectors'
import Spinner from './Spinner' //default function, no {}
import {fillOrder} from '../store/interactions'






const renderOrder = (order, props) => {
    const {dispatch, exchange, account} = props //pull from props, these are mapped to it in mapStateToProps()
    return(
        <OverlayTrigger
            key={order.id}
            placement = 'auto'
            overlay={
                <Tooltip id={order.id}>                   
                    {`Click here to ${order.orderFillAction}` }                   
                </Tooltip>
            }
        >
            <tr 
                key={order.id}
                className="order-book-order"
                onClick={(e) => fillOrder(dispatch, exchange, order, account)}
            >
                <td>{order.tokenAmount}</td>
                <td className={`text-${order.orderTypeClass}`}>{order.tokenPrice}</td>
                <td>{order.etherAmount}</td>
            </tr>
        </OverlayTrigger>
    )
}


//need to check if orderBook is loaded to state first, can't just put it in the render as it will try to display before its loaded
const showOrderBook = (props) => {
    const {orderBook} = props //fetch key 'orderBook' from props

    //render orders -> list sell orders, show assets, list buy orders
    return(
        <tbody>
            {orderBook.sellOrders.map((order) => renderOrder(order, props))}
            <tr>
                <th>BB</th>
                <th>BB/ETH</th>
                <th>ETH</th>
            </tr>
            {orderBook.buyOrders.map((order) => renderOrder(order, props))}
        </tbody>
    )
}

class OrderBook extends Component {
    render(){
        //console.log(this.props.showOrderBook, this.props.orderBook)
        return(            
            <div className="vertical">
                <div className="card bg-dark text-white">
                    <div className="card-header">
                    Order Book
                    </div>
                    <div className="card-body order-book">
                        <table className = "table table-dark table-sm small">
                            {this.props.showOrderBook ? showOrderBook(this.props) : <Spinner type='table'/>}
                        </table>    
                    </div>
                </div>
            </div>           
        )
    }
}

function mapStateToProps(state){
    
    const orderBookLoaded = orderBookLoadedSelector(state)
    const orderFilling = orderFillingSelector(state)
    
    return{
        orderBook: orderBookSelector(state),
        showOrderBook: orderBookLoaded && !orderFilling,//only show order book if it is loaded and not currently filling

        exchange: exchangeSelector(state),
        exchangeEtherBalance: exchangeEtherBalanceSelector(state),
        exchangeTokenBalance: exchangeTokenBalanceSelector(state),
        account: accountSelector(state)
    }
}

export default connect(mapStateToProps)(OrderBook)