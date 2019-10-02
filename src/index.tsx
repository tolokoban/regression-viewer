import React from 'react'
import ReactDOM from 'react-dom'
import Theme from "./tfw/theme"
import App from './regression-viewer/app'

import './tfw/font/josefin.css'

Theme.apply("default");

async function start() {
    try {
        ReactDOM.render(
            <App />,
            document.getElementById('root'));
    }
    catch( ex ) {
        console.error(ex)
    }
}

start()
