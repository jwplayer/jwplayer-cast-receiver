/**
 * RepeatModes for the Queue.
 *
 * @readonly
 * @enum {string}
 */
export const RepeatMode = {
    /**
     * When the queue is completed the media session is terminated.
     */
    REPEAT_OFF: 'REPEAT_OFF',

    /**
     * All the items in the queue will be played indefinitely,
     * when the last item is played it will play the first item again.
     */
    REPEAT_ALL: 'REPEAT_ALL',

    /**
     * The current item will be played repeatedly.
     */
    REPEAT_SINGLE: 'REPEAT_SINGLE',

    /**
     * All the items in the queue will be played indefinitely,
     * when the last item is played it will play the first item
     * again (the list will be shuffled by the receiver first).
     */
    REPEAT_ALL_AND_SHUFFLE: 'REPEAT_ALL_AND_SHUFFLE'
};
