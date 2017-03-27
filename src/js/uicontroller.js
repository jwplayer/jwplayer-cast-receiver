import * as Events from './events';
import { PlayerState } from './cast/playerstate';
import { RepeatMode } from './cast/repeatmode';
import MediaOverlay, { MEDIA_OVERLAY_ELEMENTS } from './view/mediaoverlay';
import * as UIUtil from './utils/uiutil';

export const Flag = {
    SEEK: 'flag-seek',
    USER_INACTIVE: 'flag-user-inactive',
    RECOVERABLE_ERROR: 'flag-recoverable-error'
};

export const UIState = {
    APP_STATE_LOADING: 'app-state-loading',
    APP_STATE_IDLE: 'app-state-idle',
    CONTENT_STATE_LOADING: 'content-state-loading',
    CONTENT_STATE_PLAYING: 'content-state-playback',
    CONTENT_STATE_BUFFERING: 'content-state-buffering',
    CONTENT_STATE_PAUSED: 'content-state-paused',
    CONTENT_STATE_NEXTUP: 'content-state-nextup',
    APP_STATE_ERROR: 'app-state-error',
    AD_PLAYBACK: 'ad-playback'
};

export const USER_ACTIVITY_TIMEOUT = 5000;

/**
 * Applies UI related config parameters.
 */
function applyConfig(config) {
    const hasLogo = typeof (config.logoUrl) === 'string' && config.logoUrl.length > 0;

    // TODO: apply more config parameters.
    if (typeof (config.theme) === 'string' && config.theme.length > 0) {
        document.body.className = `theme-${UIUtil.escapeHtml(config.theme)}`;
    }
    Array.from(document.getElementsByClassName('logo')).forEach(element => {
        if (hasLogo) {
            element.style.backgroundImage = `url(${config.logoUrl})`;
        } else {
            element.style.display = 'none';
        }
    });
    if (typeof (config.siteName) === 'string' && config.siteName.length > 0) {
        document.title = config.siteName;
    }
}

/**
 * Controller for the Chromecast UI.
 */
export default function UIController(element, events, config, mediaManager) {

    // TODO: get rid of dependency on jwplayer global
    // jwplayer.js utils
    let utils = jwplayer.utils;

    // Current player state.
    let playerState;

    // Current ui state.
    let uiState;

    // Current playback position.
    let currentTime;

    // Current media item.
    let currentItem;

    // Current queue repeat mode.
    let queueRepeatMode;

    // Construct a new media overlay.
    let overlayContainer = element.getElementsByClassName('overlay')[0];

    let errorElement = element.getElementsByClassName('jw-error-message')[0];

    // Icon displaying the player state.
    let stateIcon = document.getElementById('jw-icon-state');

    // Note that we are passing in elements to the MediaOverlay to allow
    // for testability and to keep the UI flexible.
    let mediaOverlay = new MediaOverlay(overlayContainer,
        UIUtil.getElementsByClassNames(overlayContainer, MEDIA_OVERLAY_ELEMENTS));

    // Active UI flags.
    let activeFlags = [];

    // Timeout Id for the userActivity function.
    let userActivityTimeoutId = -1;

    // Whether ads are playing.
    let adPlaying = false;
    let adPodIndex = 1;
    let adPodLength = 1;

    // Transition Id for timeouts.
    let stateTransitionTimeoutId = -1;

    // Apply the passed in config.
    applyConfig(config);

    // Set the initial state -> app-loading.
    setState(UIState.APP_STATE_LOADING);

  /*
   * Utility functions
   */

    function setState(state) {
        uiState = state;
        element.className = `${state} ${activeFlags.join(' ')}`;
    }

    function setFlag(flag) {
        if (activeFlags.indexOf(flag) < 0) {
            utils.addClass(element, flag);
            activeFlags.push(flag);
        }
    }

    function removeFlag(flag) {
        let flagIndex = activeFlags.indexOf(flag);
        if (flagIndex >= 0) {
            utils.removeClass(element, flag);
            activeFlags.splice(flagIndex, 1);
        }
    }

    function userActivityHandler() {
        clearTimeout(userActivityTimeoutId);
        removeFlag(Flag.USER_INACTIVE);
        userActivityTimeoutId = setTimeout(() => {
            setFlag(Flag.USER_INACTIVE);
        }, USER_ACTIVITY_TIMEOUT);
    }

    function checkToggleNextUp(time, duration) {
        if (queueRepeatMode == RepeatMode.REPEAT_ALL_AND_SHUFFLE) {
            // Auto Advance is not supported with this queue mode.
            return false;
        }
        return config.autoAdvance && config.autoAdvanceWarningOffset
            && typeof (config.autoAdvanceWarningOffset) === 'number'
            && duration - currentTime <= config.autoAdvanceWarningOffset;
    }

    /**
     * Maps UI states to PlayerStates.
     */
    function setUIStateToPlayerState(state) {
        switch (state) {
            case PlayerState.PAUSED:
                stateIcon.className = 'jw-icon-pause';
                loadCurrentItemMetadata();
                setState(UIState.CONTENT_STATE_PAUSED);
                break;
            case PlayerState.BUFFERING:
                if (currentTime > 0) {
                    setTimeout(() => {
                        // Set the className to content-state-buffering
                        // 2 seconds after the player enters the buffer state.
                        if (playerState == PlayerState.BUFFERING && !adPlaying) {
                            setState(UIState.CONTENT_STATE_BUFFERING);
                        }
                    }, 2000);
                }
                break;
            case PlayerState.IDLE:
                stateIcon.className = 'jw-icon-pause';
                setState(UIState.APP_STATE_IDLE);
                break;
            case PlayerState.PLAYING:
                stateIcon.className = 'jw-icon-play';
                setState(UIState.CONTENT_STATE_PLAYING);
                break;
            default:
                break;
        }
    }

    function loadCurrentItemMetadata() {
        mediaOverlay.updateMediaMeta(currentItem.media.metadata, false);
    }

  /*
   * Event Handlers
   */

    events.subscribe(Events.APP_READY, () => setState(UIState.APP_STATE_IDLE));

    events.subscribe(Events.MEDIA_LOAD, (event) => {
        // Cancel any UI transitions if scheduled.
        errorElement.textContent = '';
        window.clearTimeout(stateTransitionTimeoutId);
        removeFlag(Flag.RECOVERABLE_ERROR);
        setState(UIState.CONTENT_STATE_LOADING);
        currentItem = event.item;
        mediaOverlay.updateContentProgress(0, 0);
        loadCurrentItemMetadata();
    });

    events.subscribe(Events.STATE_CHANGE, (event) => {
        playerState = event.newState;
        if (playerState == PlayerState.IDLE) {
            setState(UIState.APP_STATE_IDLE);
        } else if (uiState != UIState.CONTENT_STATE_NEXTUP
        || (playerState != PlayerState.PLAYING
        && uiState == UIState.CONTENT_STATE_NEXTUP)) {
            setUIStateToPlayerState(playerState);
        }
    });

    events.subscribe(Events.MEDIA_TIME, event => {
        if (event.currentTime < currentTime) {
        // Handle time updates that are smaller than
        // what we we know always as user activity.
            userActivityHandler();
            if (mediaOverlay.displayingNextUp) {
            // Hide the next up overlay if a user seeks back.
                loadCurrentItemMetadata();
                setUIStateToPlayerState(playerState);
            }
        }
        currentTime = event.currentTime;
        mediaOverlay.updateContentProgress(event.currentTime, event.duration);

        let shouldDisplayNextUp = checkToggleNextUp(currentTime, event.duration);

    // Check whether the state should be updated to display the next up overlay.
        if (!mediaOverlay.displayingNextUp && shouldDisplayNextUp) {
            let nextQueueItem = mediaManager.getNextItemInQueue();
            if (nextQueueItem) {
                mediaOverlay.updateMediaMeta(nextQueueItem.media.metadata, true);
            }
        }

        if (shouldDisplayNextUp && uiState != UIState.CONTENT_STATE_NEXTUP) {
            setState(UIState.CONTENT_STATE_NEXTUP);
        }
    });

    events.subscribe(Events.USER_ACTIVITY, userActivityHandler);
    events.subscribe(Events.QUEUE_LOAD, event => {
        queueRepeatMode = event.queueRepeatMode;
        return queueRepeatMode;
    });
    events.subscribe(Events.QUEUE_UPDATE, () => {
        if (mediaOverlay.displayingNextUp) {
            let nextQueueItem = mediaManager.getNextItemInQueue();
            mediaOverlay.updateMediaMeta(nextQueueItem.media.metadata, true);
        }
    });

    // Flag toggling.
    events.subscribe(Events.MEDIA_SEEK, () => setFlag(Flag.SEEK));
    events.subscribe(Events.MEDIA_SEEKED, () => removeFlag(Flag.SEEK));

    events.subscribe(Events.AD_IMPRESSION, event => {
        adPlaying = true;
        let meta = event.meta;
        adPodIndex = meta.sequence ? meta.sequence : 1;
        adPodLength = meta.podcount ? meta.podcount : 1;
        setState(UIState.AD_PLAYBACK);
    });

    events.subscribe(Events.AD_PLAY, () => {
        stateIcon.className = 'jw-icon-play';
    });
    events.subscribe(Events.AD_PAUSE, () => {
        stateIcon.className = 'jw-icon-pause';
    });

    events.subscribe(Events.AD_TIME, event => {
        mediaOverlay.updateAdProgress(Math.round(event.duration - event.position), adPodIndex, adPodLength);
    });

    events.subscribe(Events.AD_COMPLETE, () => {
        adPlaying = false;
        // Force the progress bar to back into 'content mode'.
        mediaOverlay.updateContentProgress(0, 0);
        setUIStateToPlayerState(PlayerState.BUFFERING);
    });
    events.subscribe(Events.AD_ERROR, () => {
        adPlaying = false;
    });

    events.subscribe(Events.MEDIA_ERROR, event => {
        errorElement.textContent = event.error.message;

        if (event.willAdvance && event.nextItem) {
            setFlag(Flag.RECOVERABLE_ERROR);
            mediaOverlay.updateMediaMeta(event.nextItem.media.metadata, true);
            const DURATION = 5;
            let time = Date.now();
            let updateCountdown = function() {
                let position = (Date.now() - time) / 1000;
                mediaOverlay.updateContentProgress(position, DURATION);
                if (position < DURATION) {
                    stateTransitionTimeoutId = window.setTimeout(updateCountdown, 1000);
                }
            };
            updateCountdown();
        } else {
            stateTransitionTimeoutId = window.setTimeout(() => {
                setState(UIState.APP_STATE_IDLE);
            }, 5000);
        }

    // Set the UI state to error.
        setState(UIState.APP_STATE_ERROR);
    });

}
