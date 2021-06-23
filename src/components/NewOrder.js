import React, { Component } from 'react'
import { connect } from 'react-redux'
import {Tabs, Tab, OverlayTrigger, Tooltip} from 'react-bootstrap'
import Spinner from './Spinner'
import {
    exchangeSelector,
    tokenSelector,
    accountSelector,
    web3Selector,
    buyOrderSelector,
    sellOrderSelector
} from '../store/selectors'
import {
    buyOrderAmountChanged,
    buyOrderPriceChanged,
    sellOrderAmountChanged,
    sellOrderPriceChanged
} from '../store/actions'
import {
    makeBuyOrder,
    makeSellOrder
} from '../store/interactions'

const showForm = (props) => {    

    const {
        dispatch,        
        exchange,
        token,
        account,
        web3,
        buyOrder,
        sellOrder, 
        showBuyTotal,
        showSellTotal
    } = props //pull data from props

    //console.log("MakeBuyOrder: ", exchange)

    //Sufficient funds must be deposeted to the exchange from the appropriate account to ensure the order can complete, otherwise, a contract exception will be shown in MetaMask when attempting to fill an order
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
          Please be sure to have enough funds deposited to the exchange to make sure the order can complete.
        </Tooltip>
    );

    //using bootstrap tabs, imported above
    return(
        <Tabs defaultActiveKey="buy" className='bg-dark text-white'>
            <Tab eventKey="buy" title="Buy" className="bg-dark">

                <form classname="row" onSubmit={(event) =>{
                    event.preventDefault()
                    makeBuyOrder(dispatch, exchange, token, web3, buyOrder, account)
                }}>
                    <div className="form-group small">
                        <label>Buy Amount (BB)</label>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Buy Amount (BB)"
                                onChange={(e) => dispatch(buyOrderAmountChanged(e.target.value))/*dispatch change event to redux*/}
                                className="form-control form-control-sm bg-dark text-white"
                                required
                            />
                        </div>                    
                    </div>
                    <div className="form-group small">
                        <label>Buy Price (ETH)</label>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Buy Price (ETH)"
                                onChange={(e) => dispatch(buyOrderPriceChanged(e.target.value))/*dispatch change event to redux*/}
                                className="form-control form-control-sm bg-dark text-white"
                                required
                            />
                        </div>                    
                    </div>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 400 }}
                        overlay={renderTooltip}
                    >
                        <button 
                        type="submit" 
                        className="btn btn-primary btn-block btn-sm"
                        >
                            SUBMIT BUY ORDER
                        </button>
                    </OverlayTrigger>
                    {showBuyTotal ? <small>Total: {buyOrder.amount * buyOrder.price /**calculate total */} ETH</small> : null}
                    
                </form>
             
           


            </Tab>
            <Tab eventKey="sell" title="Sell" className="bg-dark">
                <form onSubmit={(event) => {
                    event.preventDefault()
                    makeSellOrder(dispatch, exchange, token, web3, sellOrder, account)
                    }}>
                    <div className="form-group small">
                    <label>Sell Amount (BB)</label>
                    <div className="input-group">
                        <input
                        type="text"
                        className="form-control form-control-sm bg-dark text-white"
                        placeholder="Sell amount (BB)"
                        onChange={(e) => dispatch( sellOrderAmountChanged( e.target.value ) )}
                        required
                        />
                    </div>
                    </div>
                    <div className="form-group small">
                    <label>Sell Price (ETH)</label>
                    <div className="input-group">
                        <input
                        type="text"
                        className="form-control form-control-sm bg-dark text-white"
                        placeholder="Sell Price (ETH)"
                        onChange={(e) => dispatch( sellOrderPriceChanged( e.target.value ) )}
                        required
                        />
                    </div>
                    </div>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 400 }}
                        overlay={renderTooltip}
                    >
                        <button 
                        type="submit" 
                        className="btn btn-primary btn-block btn-sm"
                        >
                            SUBMIT SELL ORDER
                        </button>
                    </OverlayTrigger>
                    { showSellTotal ? <small>Total: {sellOrder.amount * sellOrder.price} ETH</small> : null }
                </form>
            </Tab>
        </Tabs>
    )
}//show form

class NewOrder extends Component {
    render(){
        return(            
            <div className="vertical">
                <div className="card bg-dark text-white">
                    <div className="card-header">
                    New Order
                    </div>
                    <div className="card-body">
                    {this.props.showForm ? showForm(this.props) : <Spinner />}
                    </div>
                </div>
            </div>           
        )
    }
}

function mapStateToProps(state){
    const buyOrder = buyOrderSelector(state)
    const sellOrder = sellOrderSelector(state)

    return{
        account: accountSelector(state),
        exchange: exchangeSelector(state),        
        web3: web3Selector(state),
        token: tokenSelector(state),
        buyOrder,
        sellOrder,
        showForm: !buyOrder.making && !sellOrder.making,
        showBuyTotal: buyOrder.amount && buyOrder.price,
        showSellTotal: sellOrder.amount && sellOrder.price
    }
}

export default connect(mapStateToProps)(NewOrder)