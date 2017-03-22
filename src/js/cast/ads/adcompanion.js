export default class AdCompanion {

    constructor(width, height, type, source, trackers, clickthrough) {
        this.width = width ? width : 0;
        this.height = height ? height : 0;
        this.type = type;
        this.source = source;
        this.trackers = trackers ? trackers : {};
        this.clickthrough = clickthrough;
    }

    static convertImaCompanions() {
        let convertedCompanions = [];
        convertedCompanions.forEach(companionAd => {
            convertedCompanions.push(new AdCompanion(
            companionAd.getWidth(),
            companionAd.getHeight(),
            'html',
            companionAd.getContent(),
            null,
            null
        ));
        });
        return convertedCompanions;
    }

}
