/**
 * The elements required to build a progress bar.
 */
export const PROGRESS_BAR_ELEMENTS = [
    'jw-text-elapsed',
    'jw-text-duration',
    'jw-progress-bar'
];

export default function ProgressBar(elements) {

    // TODO: get rid of global jwplayer dependency.
    let utils = jwplayer.utils;
    let mediaDuration;

    let elapsedElem = elements[PROGRESS_BAR_ELEMENTS[0]];
    let durationElement = elements[PROGRESS_BAR_ELEMENTS[1]];
    let sliderElem = elements[PROGRESS_BAR_ELEMENTS[2]];

    return {
        /**
         * Updates the progress bar.
         */
        update: function(time, duration) {
            // TODO: LIVE Stream support
            if (time == 0 && duration == 0) {
                elapsedElem.innerText = '--:--';
                durationElement.innerText = '--:--';
                sliderElem.style.width = '0%';
                mediaDuration = 0;
            } else if (duration === Infinity) {
                elapsedElem.innerText = '';
                durationElement.innerText = 'Live';
            } else {
                elapsedElem.innerText = utils.timeFormat(time);
                let durationChanged = mediaDuration != duration;
                if (durationChanged) {
                    mediaDuration = duration;
                    durationElement.innerText = utils.timeFormat(mediaDuration);
                }
                let percentage = (time / duration) * 100;
                sliderElem.style.width = percentage + '%';
            }
        },
        updateAdProgress: function(timeLeft, podIndex, podLength) {
            elapsedElem.innerText = utils.timeFormat(timeLeft);
            durationElement.innerText = `Ad ${podIndex} of ${podLength}`;
        }
    };
}
