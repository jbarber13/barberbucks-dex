import React, { Component } from 'react'
import { connect } from 'react-redux'


class Stub extends Component {
    render(){
        return(
            <div></div>
        )
    }
}

function mapStateToProps(state){
    return{
        //msc
    }
}

export default connect(mapStateToProps)(Stub)