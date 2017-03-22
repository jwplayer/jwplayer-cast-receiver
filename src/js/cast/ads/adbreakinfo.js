export default class AdBreakInfo {

    constructor(id, position) {
        if (typeof (id) !== 'string'
            || typeof (position) !== 'number') {
            throw new Error('Invalid arguments supplied');
        }
        this.id = id;
        this.position = position;
        this.isWatched = false;
        this.duration = 0;
        this.breakClipIds = null;
    }

}
