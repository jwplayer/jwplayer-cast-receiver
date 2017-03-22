/**
 * Fired when the application has been loaded and is ready to
 * play content.
 */
export const APP_READY = 'ready';

/**
 * Fired when the player state changes.
 * Note: this only fires for state changes that comply with
 * the definition of state in the Chromecast protocol.
 */
export const STATE_CHANGE = 'stateChange';

/**
 * Fired when the MediaManager loads a single media item on the JW Player.
 */
export const MEDIA_LOAD = 'mediaLoad';

/**
 * Fired when the MediaManager has loaded a media item on the JW Player,
 * just before playback starts.
 */
export const MEDIA_LOADED = 'mediaLoaded';

/**
 * Fired when jwplayer.js reports that playback has begun.
 */
// export const MEDIA_PLAY = 'mediaPlay';

/**
 * Fired when a SEEK request has been received.
 */
export const MEDIA_SEEK = 'mediaSeek';

/**
 * Fired when a SEEK request has been successfully processed.
 */
export const MEDIA_SEEKED = 'mediaSeeked';

/**
 * Fired when content playback progresses.
 */
export const MEDIA_TIME = 'mediaTime';

/**
 * Fired when a media item has completed playback.
 */
export const MEDIA_COMPLETE = 'mediaComplete';

/**
 * Fired when a queue is being loaded on the receiver.
 */
export const QUEUE_LOAD = 'queueLoad';

/**
 * Fired when the queue has been updated.
 */
export const QUEUE_UPDATE = 'queueUpdate';

/**
 * Fired when the queue becomes empty.
 */
export const QUEUE_COMPLETE = 'queueComplete';

/**
 * Fired when ad playback begins.
 */
export const AD_IMPRESSION = 'adImpression';

/**
 * Fired whenever ad playback begins.
 */
export const AD_PLAY = 'adPlay';

/**
 * Fired when an ad is being paused.
 */
export const AD_PAUSE = 'adPause';

/**
 * Fired when ad playback progresses.
 */
export const AD_TIME = 'adTime';

/**
 * Fired when an ad creative has been completed.
 */
export const AD_COMPLETE = 'adComplete';

/**
 * Fired when an ad has been skipped.
 */
export const AD_SKIPPED = 'adSkipped';

/**
 * Fired when an Ad Error occurs.
 */
export const AD_ERROR = 'adError';

/**
 * Fired whenever user activity occurs.
 */
export const USER_ACTIVITY = 'userActivity';

/**
 * Fired when a media error has occured.
 */
export const MEDIA_ERROR = 'mediaError';

/**
 * A tiny, massively useful EventBus that can be used for event distribution.
 * Adapted from: https://davidwalsh.name/pubsub-javascript
 */
export default function EventBus() {
    let topics = {};
    let hOP = topics.hasOwnProperty;

    return {
        subscribe: function(topic, listener) {
            // Create the topic's object if not yet created.
            if (!hOP.call(topics, topic)) {
                topics[topic] = [];
            }

            // Add the listener to the queue.
            let index = topics[topic].push(listener) - 1;

            // Provide handle back for removal of topic.
            return {
                remove: function() {
                    delete topics[topic][index];
                }
            };
        },
        publish: function(topic, info) {
            // If the topic doesn't exist, or there's no listeners in queue, just leave.
            if (!hOP.call(topics, topic)) {
                return;
            }

            // Cycle through topics queue, fire!
            topics[topic].forEach(function(item) {
                item(info != undefined ? info : {});
            });
        }
    };
}
