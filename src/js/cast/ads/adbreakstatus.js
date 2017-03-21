export default class AdBreakStatus {

    constructor(currentBreakTime, currentBreakClipTime) {
        this.currentBreakTime = currentBreakTime;
        this.currentBreakClipTime = currentBreakClipTime;
        this.breakId = null;
        this.breakClipId = null;
        this.whenSkippable = -1;
    }

}
