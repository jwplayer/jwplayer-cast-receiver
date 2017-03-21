import Http from '../utils/http';

export default class ConfigLoader {

    static getConfig(appName) {
        return new Promise((resolve, reject) => {
            let configUrl = DEBUG ? `./${appName}/config.json` : `https://${appName}.jwpapp.com/config.json`;
            Http.get(configUrl).then((config) => {
                if (this.validateConfig(config)) {
                    resolve(config);
                } else {
                    reject('Invalid configuration');
                }
            }, reject);
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
