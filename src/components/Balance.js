import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    loadBalances,
    depositEther,
    withdrawEther,
    depositToken,
    withdrawToken,
    
} from '../store/interactions'
import {Tabs, Tab} from 'react-bootstrap'
import Spinner from './Spinner'
import {
    exchangeSelector,
    tokenSelector,
    web3Selector,
    accountSelector,
    etherBalanceSelector,
    tokenBalanceSelector,
    exchangeEtherBalanceSelector,
    exchangeTokenBalanceSelector,
    balancesLoadingSelector,
    etherDepositAmountSelector,
    etherWithdrawAmountSelector,
    tokenDepositAmountSelector, 
    tokenWithdrawAmountSelector    
} from '../store/selectors'
import {etherDepositAmountChanged, etherWithdrawAmountChanged, tokenDepositAmountChanged, tokenWithdrawAmountChanged, balancesLoaded} from '../store/actions'



function renderBalances (_token, _balance, _ecxhangeBalance){

    return(
        <tbody>
            <tr>
                <td>{_token}</td>
                <td>{_balance}</td>
                <td>{_ecxhangeBalance}</td>
            </tr>
        </tbody>
    )
}
function initBalanceHeader (){
    return (
        <thead>
            <tr>
                <th>Token</th>
                <th>Wallet</th>
                <th>Exchange</th>
            </tr>
        </thead>
    )
}





const showForm = (props) => {
    

    const {
        dispatch,
        etherBalance,
        tokenBalance,
        exchangeEtherBalance,
        exchangeTokenBalance, 
        etherDepositAmount, 
        etherWithdrawAmount,
        tokenDepositAmount,
        tokenWithdrawAmount,
        exchange,
        token,
        account,
        web3,
        
    } = props //pull data from props

    

    //using bootstrap tabs, imported above
    return(
        <Tabs defaultActiveKey="deposit" className='bg-dark text-white'>
            <Tab eventKey="deposit" title="Deposit" className="bg-dark">
                <table className="table table-dark table-sm small">
                    {initBalanceHeader()}
                    {renderBalances("ETH", etherBalance, exchangeEtherBalance)}
                </table>
                <form classname="row" onSubmit={(event) =>{
                    event.preventDefault()
                    
                    depositEther(dispatch, exchange, web3, etherDepositAmount, account)
                    //console.log("form submitting...")
                }}>
                    <div className="col-12 col-sm pr-sm-2">
                        <input
                            type="text"
                            placeholder="ETH Amount"
                            onChange={(e) => dispatch(etherDepositAmountChanged(e.target.value))/*dispatch change event to redux*/}
                            className="form-control form-control-sm bg-dark text-white"
                            required
                        />
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block btn-sm"
                            >Deposit ETH
                        </button>
                            
                    </div>
                   
                </form>
                <table className="table table-dark table-sm small">
                    {renderBalances("BB", tokenBalance, exchangeTokenBalance)}                    
                </table>
                <form classname="row" onSubmit={(event) =>{
                    event.preventDefault()
                    depositToken(dispatch, exchange, web3, token, tokenDepositAmount, account)
                    //console.log("form submitting...")
                }}>
                    <div className="col-12 col-sm pr-sm-2">
                        <input
                            type="text"
                            placeholder="BB Amount"
                            onChange={(e) => dispatch(tokenDepositAmountChanged(e.target.value))/*dispatch change event to redux*/}
                            className="form-control form-control-sm bg-dark text-white"
                            required
                        />
                        <button type="submit" className="btn btn-primary btn-block btn-sm">Deposit BB</button>
                    </div>                   
                </form>                
            </Tab>




            <Tab eventKey="withdraw" title="Withdraw" className="bg-dark">
                <table className="table table-dark table-sm small">
                    {initBalanceHeader()}           
                    {renderBalances("ETH", etherBalance, exchangeEtherBalance)}          
                </table>
                <form classname="row" onSubmit={(event) =>{
                    event.preventDefault()
                    withdrawEther(dispatch, exchange, web3, etherWithdrawAmount, account)
                    //console.log("form submitting...")
                }}>
                    <div className="col-12 col-sm pr-sm-2">
                        <input
                            type="text"
                            placeholder="ETH Amount"
                            onChange={(e) => dispatch(etherWithdrawAmountChanged(e.target.value))/*dispatch change event to redux*/}
                            className="form-control form-control-sm bg-dark text-white"
                            required
                        />
                        <button type="submit" className="btn btn-primary btn-block btn-sm">Withdraw ETH</button>
                    </div>
                   
                </form>
                <table className="table table-dark table-sm small">
                    {renderBalances("BB", tokenBalance, exchangeTokenBalance)}                    
                </table>
                <form classname="row" onSubmit={(event) =>{
                    event.preventDefault()
                    withdrawToken(dispatch, exchange, web3, token, tokenWithdrawAmount, account)
                    //console.log("form submitting...")
                }}>
                    <div className="col-12 col-sm pr-sm-2">
                        <input
                            type="text"
                            placeholder="BB Amount"
                            onChange={(e) => dispatch(tokenWithdrawAmountChanged(e.target.value))/*dispatch change event to redux*/}
                            className="form-control form-control-sm bg-dark text-white"
                            required
                        />
                        <button type="submit" className="btn btn-primary btn-block btn-sm">Withdraw BB</button>
                    </div>                   
                </form>
                
            </Tab>
        </Tabs>
    )
}

class Balance extends Component {
    componentWillMount() {
        this.loadBlockchainData()
    }    

    

    //CHECK NETWORK AND ACCOUNT IN META MASK
    async loadBlockchainData() {    
        const {dispatch, web3, exchange, token, account} = this.props //pull from props
        await loadBalances(dispatch, web3, exchange, token, account)
    }//loadBlockchainData

    

    render(){
        return(            
            <div className="vertical">
                <div className="card bg-dark text-white">
                    <div className="card-header">
                    Balance 
                    
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
    //only show balances if they have already loaded
    const balancesLoading = balancesLoadingSelector(state)
    

    
    return{
        account: accountSelector(state),
        exchange: exchangeSelector(state),        
        web3: web3Selector(state),
        token: tokenSelector(state),
        etherBalance: etherBalanceSelector(state),
        tokenBalance: tokenBalanceSelector(state),
        exchangeEtherBalance: exchangeEtherBalanceSelector(state),
        exchangeTokenBalance: exchangeTokenBalanceSelector(state),
        balancesLoading,
        showForm: !balancesLoading, //local function above - only show if balances are not currently loading --> failed or complete
        etherDepositAmount: etherDepositAmountSelector(state),
        etherWithdrawAmount: etherWithdrawAmountSelector(state),
        tokenDepositAmount: tokenDepositAmountSelector(state),
        tokenWithdrawAmount: tokenWithdrawAmountSelector(state)
    }
}

export default connect(mapStateToProps)(Balance)