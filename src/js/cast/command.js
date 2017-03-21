/**
 * Commands a custom receiver can support.
 * Pulled in from cast.receiver.media.Command for convenience.
 *
 * @readonly
 * @enum {number}
 */
export const Command = {
    ALL_BASIC_MEDIA: 15,
    PAUSE: 1,
    QUEUE_NEXT: 64,
    QUEUE_PREV: 128,
    QUEUE_SHUFFLE: 256,
    SEEK: 2,
    STREAM_MUTE: 8,
    STREAM_VOLUME: 4
};
