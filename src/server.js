import express from "express";
import path from "path";

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter, matchPath } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import Helmet from "react-helmet";
import routes from "./routes";
import Layout from "./components/Layout";
import createStore, { initializeSession } from "./store";
import Handlebars from 'handlebars';

const app = express();

app.use( express.static( path.resolve( __dirname, "../dist" ) ) );

app.get( "/*", ( req, res ) => {
    const context = { };
    const store = createStore( );

    store.dispatch( initializeSession( ) );

    let all_dispatched = [];

    routes.forEach(function(route, route_index) {
        //console.log('route', route);
        //console.log('route_index', route_index);

        var match = matchPath( req.url, route );
        if (match)
        {
            console.log('match', match);
            const component = route.component;
            //console.log('component', component);
            const serverFetch = component.serverFetch;
            console.log('serverFetch', serverFetch);

            const dispatched = store.dispatch( serverFetch(match.params) )
            console.log('dispatched', dispatched);
            all_dispatched.push(dispatched);
        }
    });

    //const match = routes.find(function(route) { return matchPath( req.url, route )});

    //const match_data = matchPath( req.url, match );
    
    //console.log('match', match);
    //console.log('match_data', match_data);

    //const filtered_routes = routes.filter( route => matchPath( req.url, route ) );
    //console.log('filtered_routes', filtered_routes);
    //const components = filtered_routes.map( route => route.component );
    //console.log('components',components);
    //const fetches = components.filter( comp => comp.serverFetch );
    //console.log('fetches',fetches);
    //const dispatched = fetches.map( comp => store.dispatch( comp.serverFetch ) )
    //const dispatched = fetches.map( comp => store.dispatch( comp.serverFetch() ) )
    //const dispatched = fetches.map( comp => comp.serverFetch( ) )
    //console.log('dispatched',dispatched);
/*
    const dataRequirements =
        routes
            .filter( route => matchPath( req.url, route ) ) // filter matching paths
            .map( route => route.component ) // map to components
            .filter( comp => comp.serverFetch ) // check if components have data requirement
            .map( comp => store.dispatch( comp.serverFetch( ) ) ); // dispatch data requirement
*/

    //Promise.all( dispatched ).then( ( ) => {
    Promise.all( all_dispatched ).then( ( ) => {
        //console.log('store', store.getState( ));
        const jsx = (
            <ReduxProvider store={ store }>
                <StaticRouter context={ context } location={ req.url }>
                    <Layout />
                </StaticRouter>
            </ReduxProvider>
        );
        const reactDom = renderToString( jsx );
        const reduxState = store.getState( );
        const helmetData = Helmet.renderStatic( );

        res.writeHead( 200, { "Content-Type": "text/html" } );
        res.end( htmlTemplate( reactDom, reduxState, helmetData ) );
    } );
} );

app.listen( 2048 );

function htmlTemplate( reactDom, reduxState, helmetData ) {

    var source = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            {{#helmetData}}
                {{&title}}
                {{&meta}}
            {{/helmetData}}
        </head>
        
        <body>
            <div id="app">{{&reactDom}}</div>
            <script>
                window.REDUX_DATA = {{&reduxState}}
            </script>
            <script src="/app.bundle.js"></script>
        </body>
        </html>
    `;

    var template = Handlebars.compile(source);

    var data = {
        "helmetData" : {
            title: helmetData.title.toString(),
            meta: helmetData.meta.toString()
        },
        "reactDom" :reactDom,
        "reduxState": JSON.stringify( reduxState )
    };

    var result = template(data);

    return result;
}