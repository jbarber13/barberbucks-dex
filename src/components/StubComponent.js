import React, { Component } from 'react'
import { connect } from 'react-redux'


class StubComponent extends Component {
    render(){
        return(            
            <div className="vertical">
                <div className="card bg-dark text-white">
                    <div className="card-header">
                    StubComponent
                    </div>
                    <div className="card-body">
                        <table className = "table table-dark table-sm small">
                        
                        </table>    
                    </div>
                </div>
            </div>           
        )
    }
}

function mapStateToProps(state){
    return{
        //TODO
    }
}

export default connect(mapStateToProps)(StubComponent)