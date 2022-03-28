/**
 * Chromecast Event Types
 * Commands senders can send to us over the media channel.
 *
 * @readonly
 * @enum {string}
 */
export const EventType = cast.framework.events.EventType;

/**
 * Events we can send to senders.
 * See: https://developers.google.com/cast/docs/reference/messages
 *
 * @readonly
 * @enum {string}
 */
export const MessageType = cast.framework.messages.MessageType;

export const ErrorType = cast.framework.messages.ErrorType;

/**
 * Reasons for the INVALID_REQUEST message.
 *
 * @readonly
 * @enum {string}
 */
export const ErrorReason = cast.framework.messages.ErrorReason;

/**
 * Possible states for the player to be in after resuming.
 * @readonly
 * @enum {string}
 */
export const SeekResumeState = cast.framework.messages.SeekResumeState;

/**
 * Reasons why the player can be in an idle state.
 *
 * @readonly
 * @enum {string}
 */
export const IdleReason = cast.framework.messages.IdleReason;
