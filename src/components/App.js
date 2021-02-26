import React, { Component } from 'react';
import './App.css';
//import Web3 from 'web3'
import Navbar from './Navbar'
import Content from './Content'
import {loadWeb3,
   loadAccount,
   loadToken,
   loadExchange
} from '../store/interactions'
import {connect} from 'react-redux'
import {contractsLoadedSelector} from '../store/selectors'

//import {accountSelector} from '../store/selectors'//import selector to test via console log

//import Token from '../abis/Token.json'


class App extends Component {  
  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }


  //CHECK NETWORK AND ACCOUNT IN META MASK
  async loadBlockchainData(dispatch) {    
    



    const web3 = await loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }

  }//loadBlockchainData  

  render() {
    return (
      <div>
        <Navbar />
        {this.props.contractsLoaded ? <Content /> : <div classname = "content"></div>}        
      </div>
    );
  }

}



function mapStateToProps(state){

  //console.log("contractsLoaded", contractsLoadedSelector(state))

  return {
    //account: accountSelector(state)//enable selector for testing via console log
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App)

//export default App;
