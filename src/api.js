import fetch from "isomorphic-fetch";

export function fetchCircuits(params) {
    console.log('fetchCircuits', params);
    return fetch( "http://ergast.com/api/f1/2018/circuits.json" )
        .then( res => res.json( ) )
        .then( res => res.MRData.CircuitTable.Circuits );
}
