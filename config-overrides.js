//const FS = require('fs')
const rewireYAML = require( 'react-app-rewire-yaml' );


module.exports = function override( config, env ) {
    //FS.writeFile('./before.json', JSON.stringify(config, null, '  '));
    // Allow YAML import at compile time.
    config = rewireYAML( config, env );
    //FS.writeFile('./after.json', JSON.stringify(config, null, '  '));
    return config;
}
