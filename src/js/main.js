import JWCastApp from './jwcastapp.js';
import ConfigLoader from './config/loader';

/* eslint no-console: 0*/

// Global debug setting.
window.DEBUG = jwplayer.version.search(/[0-9]+\.[0-9]+\.[0-9].*\+local\./) != -1;

// Enable debug logging for local jwplayer.js versions.
if (DEBUG) {
    cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);
}

// The instance of the receiver app.
let app;

// The configuration the receiver app has been instantiated with.
let loadedConfig;

// Retrieve the config by API key.
let appName = getParam('appName');
let jwKey = getParam('key');

if (appName) {
    ConfigLoader.getConfig(appName)
        .then((config) => {
            // Set the player key.
            jwplayer.key = config.key || jwKey;
            loadedConfig = config;
            // Check whether we can init the application.
            maybeInit();
        }, error => {
            console.error(error);
            exitApp();
        });
} else if (jwKey) {
    jwplayer.key = jwKey;
    loadedConfig = {
        siteName: 'Chromecast Player',
        theme: 'dark',
        logoUrl: '',
        key: jwKey
    };
    maybeInit();
} else {
    console.error('Error: appName missing.');
    exitApp();
}

// Init the application in case the config has been loaded already.
document.addEventListener('DOMContentLoaded', maybeInit);

/**
 * Initializes the JWCastApp when the DOM is ready and the config has been loaded.
 */
function maybeInit() {
    if (!app && loadedConfig && document.readyState != 'loading') {
        console.info('Initializing the JWCastApp with config %O', loadedConfig);
        // We're good to go! The document is ready and the config has been loaded.
        app = new JWCastApp(document.getElementById('app'), loadedConfig);
    }
}

/**
 * Determines the appName.
 */
function getParam(name) {
    let url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');

    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    let results = regex.exec(url);

    if (!results) {
        return null;
    } else if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function exitApp() {
    cast.receiver.CastReceiverManager.getInstance().stop();
}
