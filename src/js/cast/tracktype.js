/**
 * Media Track types.
 *
 * Pulled in from cast.receiver.media.TrackType for convenience.
 *
 * @readonly
 * @enum {string}
 */
export const TrackType = {
    /**
     * Text Track.
     */
    TEXT: 'TEXT',

    /**
     * Audio Track.
     */
    AUDIO: 'AUDIO',

    /**
     * Video Track.
     */
    VIDEO: 'VIDEO'
};

/**
 * Possible text track type (follows the HTML5 text track type definitions).
 *
 * Pulled in from cast.receiver.media.TextTrackType for convenience.
 *
 * @readonly
 * @enum {string}
 */
export const TextTrackType = {
    /**
     * Transcription or translation of the dialogue, suitable for when the sound is
     * available but not understood
     * (e.g. because the user does not understand the language of the media resource's soundtrack).
     */
    SUBTITLES: 'SUBTITLES',

    /**
     * Transcription or translation of the dialogue, sound effects, relevant musical cues,
     * and other relevant audio information, suitable for when the soundtrack is unavailable
     * (e.g. because it is muted or because the user is deaf). Displayed over the video;
     * labeled as appropriate for the hard-of-hearing.
     */
    CAPTIONS: 'CAPTIONS',

    /**
     * Textual descriptions of the video component of the media resource, intended for audio
     * synthesis when the visual component is unavailable (e.g. because the user is interacting
     * with the application without a screen, or because the user is blind).
     * Synthesized as separate audio track.
     */
    DESCRIPTIONS: 'DESCRIPTIONS',

    /**
     * Chapter titles, intended to be used for navigating the media resource.
     */
    CHAPTERS: 'CHAPTERS',

    /**
     * Tracks intended for use from script.
     */
    METADATA: 'METADATA'
};
