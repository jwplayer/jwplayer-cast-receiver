import Http from '../utils/http';

export default class ConfigLoader {

    static getConfig(appName) {
        const localConfig = `./${appName}/config.json`;
        const remoteConfig = `https://${appName}.jwpapp.com/config.json`;

        return new Promise((resolve, reject) => {
            ConfigLoader.requestConfig(localConfig, resolve, function() {
                ConfigLoader.requestConfig(remoteConfig, resolve, reject);
            });
        });
    }

    static requestConfig(configUrl, resolve, reject) {
        Http.get(configUrl).then((config) => {
            if (this.validateConfig(config)) {
                resolve(config);
            } else {
                reject('Invalid configuration: ' + configUrl);
            }
        }).catch(function() {
            reject('Invalid configuration: ' + configUrl);
        });
    }

    static validateConfig(config) {
        let valid = true;
        // At minimum we need a player key.
        if (!config.key) {
            valid = false;
        }
        if (typeof (config.autoAdvanceWarningOffset) !== 'number') {
            // Set a default offset.
            config.autoAdvanceWarningOffset = 10;
        }
        // TODO: check more params.
        return valid;
    }
}
