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

    var dispatched = routes.filter(route => matchPath( req.url, route ))
        .map(route => { return {
            'match': matchPath( req.url, route ),
            'component': route.component
        } })
        .filter(mapping => mapping.component.serverFetch)
        .map(m => store.dispatch(m.component.serverFetch(m.match.params)))

    //console.log('test', test);

/*
    const dataRequirements =
        routes
            .filter( route => matchPath( req.url, route ) ) // filter matching paths
            .map( route => route.component ) // map to components
            .filter( comp => comp.serverFetch ) // check if components have data requirement
            .map( comp => store.dispatch( comp.serverFetch( ) ) ); // dispatch data requirement
*/

/*
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
*/

    Promise.all( dispatched ).then( ( ) => {
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