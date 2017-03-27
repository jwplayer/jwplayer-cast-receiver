import ProgressBar, { PROGRESS_BAR_ELEMENTS } from './progressbar';
import * as UIUtil from '../utils/uiutil';

export const MEDIA_OVERLAY_ELEMENTS = [
    'jw-media-title',
    'jw-media-description',
    'jw-thumb-container',
    'jw-nextup-timer',
    'media-metadata'
];

export default function MediaOverlay(element, elements) {

    // UI elements
    let mediaTitle = elements[MEDIA_OVERLAY_ELEMENTS[0]];
    let mediaDescription = elements[MEDIA_OVERLAY_ELEMENTS[1]];
    let thumbnail = elements[MEDIA_OVERLAY_ELEMENTS[2]];
    let nextUpTimer = elements[MEDIA_OVERLAY_ELEMENTS[3]];
    let mediaMetadata = elements[MEDIA_OVERLAY_ELEMENTS[4]];

    // UI components
    let progressBar = new ProgressBar(UIUtil.getElementsByClassNames(element, PROGRESS_BAR_ELEMENTS));

    // Init the progress bar.
    progressBar.update(0, 0);

    return {
        updateContentProgress: function(time, duration) {
            progressBar.update(time, duration);
            if (this.displayingNextUp) {
                nextUpTimer.innerHTML = `video will play in <strong>${Math.round(duration - time)} seconds</strong>`;
            }
        },
        updateMediaMeta: function(metadata, nextUp) {
            this.displayingNextUp = nextUp;
            if (nextUp) {
                mediaTitle.innerHTML = `<strong>Next Up:</strong> ${metadata.title ? UIUtil.escapeHtml(metadata.title) : 'Unknown'}`;
            } else {
                mediaTitle.textContent = metadata.title ? metadata.title : '';
            }
            mediaDescription.textContent = metadata.subtitle ? metadata.subtitle : '';
            if (metadata.images && metadata.images.length > 0) {
                thumbnail.src = metadata.images[0].url;
            } else {
                thumbnail.style.display = 'none';
            }

            if (mediaTitle.textContent === '' && mediaDescription.textContent === '' && thumbnail.style.display === 'none') {
                mediaMetadata.style.display = 'none';
            }
        },
        updateAdProgress: progressBar.updateAdProgress
    };
}
