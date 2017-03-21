/**
 * Chromecast Event Types
 * Commands senders can send to us over the media channel.
 *
 * These have been pulled in from cast.receiver.media.MediaManager for convenience.
 *
 * @readonly
 * @enum {string}
 */
export const EventType = {
    LOAD: 'LOAD',
    STOP: 'STOP',
    PAUSE: 'PAUSE',
    PLAY: 'PLAY',
    SEEK: 'SEEK',
    SET_VOLUME: 'SET_VOLUME',
    GET_STATUS: 'GET_STATUS',
    EDIT_TRACKS_INFO: 'EDIT_TRACKS_INFO',
    QUEUE_LOAD: 'QUEUE_LOAD',
    QUEUE_UPDATE: 'QUEUE_UPDATE',
    QUEUE_INSERT: 'QUEUE_INSERT',
    QUEUE_REMOVE: 'QUEUE_REMOVE',
    QUEUE_REORDER: 'QUEUE_REORDER',
    PRELOAD: 'PRELOAD',
    CANCEL_PRELOAD: 'CANCEL_PRELOAD'
};

/**
 * Events we can send to senders.
 * See: https://developers.google.com/cast/docs/reference/messages
 *
 * @readonly
 * @enum {string}
 */
export const MessageType = {
    /**
     * Error: Broadcasted when the request by the sender can not be fulfilled because
     * the player is not in a valid state.
     */
    INVALID_PLAYER_STATE: 'INVALID_PLAYER_STATE',

    /**
     * Error: Broadcasted when the load request failed. The player state will be IDLE.
     */
    LOAD_FAILED: 'LOAD_FAILED',

    /**
     * Error: Broadcasted when the load request was cancelled (a second load request was received).
     */
    LOAD_CANCELLED: 'LOAD_CANCELLED',

    /**
     * Error: Broadcasted when the request is invalid (an unknown request type, for example).
     */
    INVALID_REQUEST: 'INVALID_REQUEST',

    /**
     * Broadcasted after a state change or after a media status request.
     * Only the MediaStatus objects that changed or were requested will be sent.
     */
    MEDIA_STATUS: 'MEDIA_STATUS'
};

/**
 * Reasons for the INVALID_REQUEST message.
 *
 * @readonly
 * @enum {string}
 */
export const ErrorReason = {
    /**
     * Returned when the command is not supported.
     */
    INVALID_COMMAND: 'INVALID_COMMAND',

    /**
     * Returned when the params are not valid or a non optional param is missing.
     */
    INVALID_PARAMS: 'INVALID_PARAMS',

    /**
     * Returned when the media session does not exist.
     */
    INVALID_MEDIA_SESSION_ID: 'INVALID_MEDIA_SESSION_ID',

    /**
     * Returned when the request ID is not unique (the receiver is processing a request with the same ID).
     */
    DUPLICATE_REQUEST_ID: 'DUPLICATE_REQUEST_ID'
};

/**
 * Possible states for the player to be in after resuming.
 * @readonly
 * @enum {string}
 */
export const SeekResumeState = {
    /**
     * Media will be forced to start after seeking.
     */
    PLAYBACK_START: 'PLAYBACK_START',

    /**
     * Media will be forced to pause after seeking.
     */
    PLAYBACK_PAUSE: 'PLAYBACK_PAUSE'
};

/**
 * Reasons why the player can be in an idle state.
 * Pulled in from cast.receiver.media.IdleReason for convenience.
 *
 * @readonly
 * @enum {string}
 */
export const IdleReason = {
    /**
     * A sender requested to stop playback using the STOP command.
     */
    CANCELLED: 'CANCELLED',

    /**
     * A sender requested playing a different media using the LOAD command.
     */
    INTERRUPTED: 'INTERRUPTED',

    /**
     * The media playback completed.
     */
    FINISHED: 'FINISHED',

    /**
     * The media was interrupted due to an error, this could happen if,
     * for example, the player could not download media due to networking errors.
     */
    ERROR: 'ERROR'
};
