export default class AdBreakClipInfo {

    constructor(id) {
        // TODO: introduce more type checking?
        if (typeof (id) !== 'string') {
            throw new Error('Invalid arguments supplied.');
        }
        this.id = id;
        this.duration = 0;
        this.clickThroughUrl = null;
        this.contentUrl = null;
        this.mimeType = null;
        this.title = null;
        this.customData = null;
    }

}
