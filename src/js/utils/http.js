/*
 * Utility Module for making XMLHttpRequests.
 *
 * Example Usage:
 *
 * http.get(url, [headers], [options])
 *  .then(callback.success)
 *  .catch(callback.error);
 */

export const REQUEST_TIMEOUT = 5000;

export default class Http {
    static ajax(method, url, headers, options) {
        return new Promise((resolve, reject) => {
            var client = new XMLHttpRequest();
            if (options) {
                for (let property in options) {
                    if (options.hasOwnProperty(property)) {
                        client[property] = options[property];
                    }
                }
            }
            client.onload = function() {
                if (this.status >= 200 && this.status < 300) {
                    resolve(this.response);
                } else {
                    reject(this.statusText);
                }
            };
            client.onerror = function() {
                reject(this.statusText);
            };
            client.open(method, url, true);
            if (headers) {
                for (let header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        client.setRequestHeader(header, headers[header]);
                    }
                }
            }
            client.timeout = REQUEST_TIMEOUT;
            client.send();
        });
    }

    static get(url, headers, options) {
        if (!options) {
            // If options are not defined, assume that we want to load a JSON document.
            options = {
                responseType: 'json'
            };
        }
        return this.ajax('GET', url, headers, options);
    }
}
