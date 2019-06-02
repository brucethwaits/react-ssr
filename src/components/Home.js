import React from "react";
import { connect } from "react-redux";
import { fetchData } from "../store";

class Home extends React.Component {
    constructor()
    {
        super();
        //this.serverFetch = fetchData({'test':'5678'});
    }

    componentDidMount( ) {
        if ( this.props.circuits.length <= 0 ) {
            console.log('fetching data client side');
            this.props.fetchData({'test':'1234'});
        }
    }

    render( ) {
        console.log('hello', (typeof window == 'undefined') ? "server" : "client" );

        //const {state, routeInfo} = this.props;

        //console.log('state',state);
        //console.log('routeInfo',routeInfo);

        const { circuits } = this.props;

        return (
            <div>
                <h2>F1 2018 Season Calendar</h2>
                <ul>
                    { circuits.map( ( { circuitId, circuitName, Location } ) => (
                        <li key={ circuitId } >{ circuitName } - { Location.locality }, { Location.country }</li>
                    ) ) }
                </ul>
            </div>
        );
    }
}

//Home.serverFetch = fetchData({'test':'5678'});

Home.serverFetch = fetchData;

/*
Home.serverFetch = () =>
{ 
    return dispatch => {
        dispatch(fetchData({'test':'4321'}))
    }
}; // static declaration of data requirements
*/

const mapStateToProps = ( state, routeInfo ) => ( {
    circuits: state.data,
    state:state,
    routeInfo:routeInfo
} );

const mapDispatchToProps = {
    fetchData,
};

export default connect( mapStateToProps, mapDispatchToProps )( Home );
