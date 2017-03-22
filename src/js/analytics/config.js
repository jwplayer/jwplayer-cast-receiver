// APP Version
import { APP_VERSION } from '../jwcastapp';

// SDK Platform
export const SDK_PLATFORM = 5;

export default class AnalyticsConfig {

    constructor(config) {
        // See: See https://github.com/jwplayer/jwplayer-analytics/blob/master/src/js/Tracker.js
        this.iossdkversion = APP_VERSION;
        this.applicationname = typeof (config.siteName) === 'string' ? config.siteName : '';
        this.sdkplatform = SDK_PLATFORM;
    }

}
