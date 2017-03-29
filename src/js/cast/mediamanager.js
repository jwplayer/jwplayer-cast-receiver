// TODO: skip ad support: playerInstance.skipAd();
import * as Events from '../events';
import { PlayerState } from './playerstate';
import { RepeatMode } from './repeatmode';
import { Command } from './command';
import { EventType, MessageType, ErrorReason, SeekResumeState, IdleReason } from './messages';
import { TrackType, TextTrackType } from './tracktype';
import AdBreakInfo from './ads/adbreakinfo';
import AdBreakClipInfo from './ads/adbreakclipinfo';
import AdBreakStatus from './ads/adbreakstatus';
import AdMeta from './ads/admeta';
import AdCompanion from './ads/adcompanion';

/**
 * Supported features of this {@link MediaManager}.
 *
 * Supported features are expressed as a summation of the supported
 * commands.
 *
 * @type {number}
 */
const SUPPORTED_FEATURES = Command.ALL_BASIC_MEDIA
    + Command.QUEUE_NEXT
    + Command.QUEUE_PREV
    + Command.QUEUE_SHUFFLE;

/**
 * Flags which are being used when serializing the mediaStatus.
 *
 * These flags have to be set in order to serialize certain elements of
 * the mediaStatus.
 *
 * @readonly
 * @enum {string}
 */
// export const MediaStatusFlags = {
//   QUEUE: 'items'
//   META: 'media'
// };

/**
 * Track index 0 always disables a track on the JW Player.
 *
 * @readonly
 */
const TRACK_DISABLED = 0;

export const ERROR_TIMEOUT = 5000;

/**
 * A cast.receiver.media.MediaManager implementation for JW Player.
 *
 * The MediaManager manages a JW Player, receives commands from senders, acts appropriately
 * on them and updates senders with status changes.
 *
 * @param {cast.receiver.ReceiverManager} receiverManager The ReceiverManager singleton.
 * @param {HTMLElement} container the container jwplayer.js can be attached to.
 */
export default function JWMediaManager(receiverManager, container, events, analyticsConfig) {

    // The current JW Player instance.
    // TODO: make this an object, which allows for multiple playerInstances per mediaSessionId
    // so we can do preloading.
    let playerInstance;

    // Represents the status of a media session.
    let mediaStatus;

    /**
     * By default we do not serialize the entire media status.
     * The following elements should be set in this block if they
     * should be serialized.
     *
     * This object is used to set the flags for which elements in the media
     * status should be serialized.
     */
        // let mediaStatusFlags = [];

        // The messageBus used for sending/receiving messages.
    let messageBus = receiverManager.getCastMessageBus(cast.receiver.media.MEDIA_NAMESPACE);

    // The requestId that will be associated with the next status update.
    // So that senders can correlate their actions with a status update.
    let currentRequestId = 0;

    // Whether we are currently processing a load request.
    let isLoading = false;

    // The last time an ad pod was initiated.
    let adPodStartTime = 0;

    // Start listening for messages.
    messageBus.addEventListener('message', dispatchEvent);

    /**
     * Broadcasts a message to every connected sender.
     * @param  {Object} message The message to send to senders.
     */
    function broadcastMessage(message) {
        try {
            messageBus.broadcast(JSON.stringify(message));
        } catch (err) {
            console.warn('Unable to broadcast message: %O', err);
        }
    }

    /**
     * Sends a message to a specific sender.
     * @param  {string} senderId The identifier of the sender to send a message to.
     * @param  {Object} message  The message to send.
     */
    function sendMessage(senderId, message) {
        try {
            messageBus.send(senderId, JSON.stringify(message));
        } catch (err) {
            console.warn('Unable to send message: %O', err);
        }
    }

    /**
     * Dispatches a message to the message handler for a specific event.
     * Also does validation of messages.
     *
     * @param  {Object} message The message to dispatch.
     */
    function dispatchEvent(message) {
        // Check if the message contains data.
        if (!message.data) {
            return;
        }

        let data;
        try {
            data = JSON.parse(message.data);
        } catch (err) {
            console.warn('Unable to parse event: %O', message);
            return;
        }

        if (!data.type) {
            // err: invalid request.
            sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
            return;
        }

        let event = {
            senderId: message.senderId,
            data: data,
            type: data.type
        };

        // Broadcast that user activity has occured so that the UI
        // can be updated appropriately.
        // TODO: we might want to limit USER_ACTIVITY to a subset of
        // events.
        if (event.type != EventType.GET_STATUS) {
            events.publish(Events.USER_ACTIVITY, {
                reason: event.type
            });
        }

        // First see if we need to handle any events that create
        // mediaSessions, or don't need one to be handled.
        switch (event.type) {
            case EventType.LOAD:
                onLoad(event);
                return;
            case EventType.QUEUE_LOAD:
                onQueueLoad(event);
                return;
            case EventType.GET_STATUS:
                onGetStatus(event);
                return;
            default:
                break;
        }

        // We're handling an event that doesn't create a media session
        // first, let's do some validation before we dispatch anything.
        if (!mediaStatus) {
            sendErrorInvalidPlayerState(event);
            return;
        }
        if (event.data.mediaSessionId != mediaStatus.mediaSessionId) {
            // err: wrong mediaSession
            // We don't have to do anything in this case.
            return;
        }

        if (event.data.requestId) {
            currentRequestId = event.data.requestId;
        }

        // Message looks good so far, proceed with dispatching it.
        switch (event.type) {
            case EventType.STOP:
                onStop(event);
                break;
            case EventType.PAUSE:
                onPause(event);
                break;
            case EventType.PLAY:
                onPlay(event);
                break;
            case EventType.SEEK:
                onSeek(event);
                break;
            case EventType.SET_VOLUME:
                onSetVolume(event);
                break;
            case EventType.EDIT_TRACKS_INFO:
                onEditTracksInfo(event);
                break;
            case EventType.QUEUE_INSERT:
                onQueueInsert(event);
                break;
            case EventType.QUEUE_UPDATE:
                onQueueUpdate(event);
                break;
            case EventType.QUEUE_REMOVE:
                onQueueRemove(event);
                break;
            case EventType.QUEUE_REORDER:
                onQueueReorder(event);
                break;
            case EventType.PRELOAD:
                onPreload(event);
                break;
            case EventType.CANCEL_PRELOAD:
                onCancelPreload(event);
                break;
            default:
                // Invalid command.
                sendError(MessageType.INVALID_REQUEST,
                    ErrorReason.INVALID_COMMAND, event);
                console.warn('Received invalid command ' + event.type);
        }
    }

    /*
     * Event Handlers.
     */

    function onLoad(event) {
        // TODO: Handle load requests where the actual media
        // doesn't change, but only it's metadata, for example
        // images. Currently we don't handle these well, but we
        if (isLoading) {
            // Send load cancelled.
            sendErrorLoadCancelled(event);
        }
        createMediaSession();
        loadItem(event.data).then(() => {
            isLoading = false;
            sendStatus(event.senderId, event.data.requestId);
        }, (error) => {
            currentRequestId = event.data.requestId;
            handleSetupError(error);
        });
        events.publish(Events.QUEUE_LOAD, {
            items: [event.data]
        });
    }

    function onStop(event) {
        if (playerInstance) {
            playerInstance.stop();
            mediaStatus.idleReason = IdleReason.CANCELLED;
            broadcastStatus();
        } else {
            sendErrorInvalidPlayerState(event);
        }
    }

    function onPause(event) {
        if (playerInstance) {
            playerInstance.pause(true);
            if (mediaStatus.breakStatus) {
                // TODO: improve / get rid of this
                // Force player state to playing.
                mediaStatus.playerState = PlayerState.PAUSED;
                broadcastStatus();
            }
        } else {
            sendErrorInvalidPlayerState(event);
        }
    }

    function onPlay(event) {
        if (playerInstance) {
            playerInstance.play(true);
            if (mediaStatus.breakStatus) {
                // TODO: improve / get rid of this
                // Force player state to playing.
                mediaStatus.playerState = PlayerState.PLAYING;
                broadcastStatus();
            }
        } else {
            sendErrorInvalidPlayerState(event);
        }
    }

    function onSeek(event) {
        if (playerInstance &&
            event.data.mediaSessionId == mediaStatus.mediaSessionId) {
            if (event.data.currentTime >= 0) {
                playerInstance.once('seeked', () => {
                    // Ensure that we broadcast a status update with the requestId
                    // for the SEEK event, so that senders can properly corellate
                    // requests and responses.
                    broadcastStatus(event.data.requestId);
                });
                playerInstance.seek(event.data.currentTime);
            }
            if (event.data.resumeState) {
                playerInstance.play(event.data.resumeState == SeekResumeState.PLAYBACK_START);
            }
        } else {
            sendErrorInvalidPlayerState(event);
        }
    }

    function onSetVolume(event) {
        // TODO: When does this ever get called?
        // It appears that default senders only change the System volume level.
        if (playerInstance) {
            mediaStatus.volume = {
                level: event.data.level,
                mute: event.data.mute
            };
            playerInstance.setVolume(event.data.level * 100);
            playerInstance.setMute(event.data.mute);
            broadcastStatus();
        } else {
            sendErrorInvalidPlayerState(event);
        }
    }

    function onGetStatus(event) {
        // TODO: NO_METADATA and NO_QUEUE_ITEMS flags support.
        sendStatus(event.senderId, event.data.requestId);
    }

    function onEditTracksInfo(event) {
        if (event.data.textTrackStyle) {
            // TODO: set textTrackStyle
            // let textTrackStyle = event.data.textTrackStyle;
            // See: https://developers.google.com/cast/docs/reference/receiver/cast.receiver.media.TextTrackStyle
            // playerInstance.setCaptions({
            //   color: '',
            //   fontSize: 0,
            //   fontFamily: '',
            //   fontOpacity: 0,
            //   backgroundColor: '',
            //   backgroundOpacity: 0,
            //   edgeStyle: '', // none || dropshadow || raised || depressed || uniform
            //   windowColor: '',
            //   windowOpacity: 0
            // });
        }

        let activeTrackIds = event.data.activeTrackIds;
        if (activeTrackIds) {
            // Whether we should disable the caption track.
            let disableCaptions = true;

            activeTrackIds.forEach(trackId => {
                let track = getTrackById(trackId);
                if (track) {
                    if (track.type == TrackType.TEXT) {
                        let playerTracks = playerInstance.getCaptionsList();
                        playerTracks.some((playerTrack, index) => {
                            if (playerTrack.id == track.trackContentId) {
                                disableCaptions = false;
                                if (playerInstance.getCurrentCaptions() != index) {
                                    playerInstance.setCurrentCaptions(index);
                                }
                                return true;
                            }
                        });
                    } else if (track.type == TrackType.AUDIO) {
                    // trackContentId for audio tracks match jwplayer.js's trackIndex.
                        playerInstance.setCurrentAudioTrack(track.trackContentId);
                    } else if (track.type == TrackType.VIDEO) {
                    // TODO
                    }
                } else {
                // err: track not found?
                // TODO: send err invalid request?
                }
            });

            // Disable caption tracks if no active tracks
            // have been supplied.
            if (disableCaptions) {
                playerInstance.setCurrentCaptions(TRACK_DISABLED);
            }
        }

        broadcastStatus();
    }

    function onQueueLoad(event) {
        if (isLoading) {
            // Send load cancelled.
            sendErrorLoadCancelled(event);
        }
        // Create a new MediaSession.
        createMediaSession();

        event.data.items.forEach((item, index) => {
            item.itemId = ++index;
        });

        // Associate it with a queue.
        mediaStatus.items = event.data.items;
        mediaStatus.repeatMode = event.data.repeatMode;

        let mediaItem = mediaStatus.items[event.data.startIndex];

        // Load the first item.
        loadItem(mediaItem)
            .then(() => {
                isLoading = false;
                sendStatus(event.senderId, event.data.requestId);
            }, (error) => {
                currentRequestId = event.data.requestId;
                handleSetupError(error);
            });

        events.publish(Events.QUEUE_LOAD, {
            items: mediaStatus.items,
            repeatMode: mediaStatus.repeatMode
        });

        // Update receivers with the new queue.
        // mediaStatusFlags.push(MediaStatusFlags.QUEUE);
    }

    function onQueueInsert(event) {
        // Find the highest itemId in mediaStatus.items
        let id = 1;
        mediaStatus.items.forEach((item) => {
            if (item.itemId >= id) {
                id = item.itemId + 1;
            }
        });

        // Start numbering from that id.
        event.data.items.forEach((item) => {
            item.itemId = id++;
        });

        // Check whether items should be added at the end of the queue.
        if (!event.data.insertBefore) {
            // Append the new items to the queue.
            mediaStatus.items = mediaStatus.items.concat(event.data.items);
        } else {
            // Figure out where we need to insert something.
            let insertBeforeIndex = findIndexOfItem(event.data.insertBefore);
            // Insert the elements at the correct index using a nifty trick
            // in order to prevent an extra array loop.
            Array.prototype.splice.apply(mediaStatus.items, [insertBeforeIndex, 0].concat(event.data.items));
        }

        // Check if we need to load a new item.
        let nextItem;
        if (event.data.currentItemIndex !== undefined) {
            nextItem = mediaStatus.items[event.data.currentItemIndex];
        } else if (event.data.currentItem && event.data.currentItem != mediaStatus.currentItem) {
            nextItem = mediaStatus.items[findIndexOfItem(event.data.currentItem)];
        }

        if (nextItem) {
            // Yes, load a new item.
            nextItem.startTimeOverride = event.data.currentTime;
            loadItem(nextItem).catch(handleSetupError);
        } else {
            // Loading not needed.
            broadcastStatus();
        }

        events.publish(Events.QUEUE_UPDATE, {
            items: mediaStatus.items
        });
    }

    function onQueueUpdate(event) {
        if (event.data.currentItemId) {
            let nextItem = mediaStatus.items[findIndexOfItem(event.data.currentItemId)];
            nextItem.startTimeOverride = event.data.currentTime;
            loadItem(nextItem).catch(handleSetupError);
        } else if (event.data.jump) {
            let newIndex = getCurrentQueueIndex() + event.data.jump;
            // Check if newIndex needs to wrap around the queue boundaries.
            if (newIndex >= mediaStatus.items.length) {
                newIndex -= mediaStatus.items.length;
            }
            if (newIndex < 0) {
                newIndex += mediaStatus.items.length;
            }
            let nextItem = mediaStatus.items[getCurrentQueueIndex() + event.data.jump];
            // Override the startTime, if necessary.
            nextItem.startTimeOverride = event.data.currentTime;
            loadItem(nextItem).catch(handleSetupError);
        }
        // Check whether repeatMode requires updating.
        if (event.data.repeatMode) {
            mediaStatus.repeatMode = event.data.repeatMode;
        }
    }

    function onQueueRemove(event) {
        if (!event.data.itemIds || event.data.itemIds.length == 0) {
            // err: invalid args
            sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
            return;
        }
        if (mediaStatus.items.length == 0) {
            sendErrorInvalidPlayerState(event);
            return;
        }
        event.data.itemIds.forEach((id) => {
            let idx = findIndexOfItem(id);
            mediaStatus.items.splice(idx, 1);
        });
        if (event.data.currentItemId && event.data.currentItemId != mediaStatus.currentItemId) {
            let nextItem = mediaStatus.items[findIndexOfItem(event.data.currentItemId)];
            nextItem.startTimeOverride = event.data.currentTime;
            loadItem(nextItem).catch(handleSetupError);
        } else if (getCurrentQueueIndex() === -1) {
                // Current queue item has been removed to, stop playback.
            if (playerInstance) {
                playerInstance.stop();
            } /* else { // err: invalid command ? } */
        } else {
                // Broadcast the new status, because we're not stopping or loading
                // (which will implicitly trigger a broadcast).
            broadcastStatus();
        }
    }

    function onQueueReorder(event) {
        let itemIds = event.data.itemIds;
        if (!itemIds) {
            sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
            return;
        }

        if (event.data.insertBefore) {
            // Find the index of the queue item we want to insert before.
            let insertBeforeIndex = findIndexOfItem(event.data.insertBefore);

            if (!insertBeforeIndex) {
                // err: could not find item to insert before.
                sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
                return;
            }

            // insertBefore is specified, and we have found the item to insert before,
            // re-order in the following fashion:
            //
            // If insertBefore is “A”
            // Existing queue: “A”,”D”,”G”,”H”,”B”
            // itemIds: “D”,”H”,”B”
            // New Order: “D”,”H”,”B”,“A”,”G”,”E”
            for (let i = insertBeforeIndex; itemIds.length > 0; i++) {
                // Get the mediaItem to reorder from the queue.
                let itemToMove = mediaStatus.items.splice(findIndexOfItem(itemIds.shift()), 1)[0]; // TODO: check for index not being out of bounds
                // Insert the item at the new index.
                mediaStatus.items.splice(i - 1, 0, itemToMove);
            }
        } else {
            // insertBefore is not specificied, re-order in the following fashion:
            // Existing queue: “A”,”D”,”G”,”H”,”B”,”E”
            // itemIds: “D”,”H”,”B”
            // New Order: “A”,”G”,”E”,“D”,”H”,”B”
            while (itemIds.length) {
                let itemToMove = mediaStatus.items.splice(findIndexOfItem(itemIds.shift()), 1)[0];
                mediaStatus.items.push(itemToMove);
            }
        }

        // Update the senders with the new queue.
        broadcastStatus();
    }

    function onPreload(event) {
        // Not supported currently.
        // We might be able to support this by
        // creating multiple player instances.
        sendError(MessageType.INVALID_REQUEST,
            ErrorReason.INVALID_COMMAND, event);
    }

    function onCancelPreload(event) {
        // Not supported currently.
        sendError(MessageType.INVALID_REQUEST,
            ErrorReason.INVALID_COMMAND, event);
    }

    /*
     * JW Player event handlers.
     * These are prefixed with 'handle' in order to distuingish them from
     * Chromecast events.
     */

    function handleComplete() {
        events.publish(Events.MEDIA_COMPLETE, {
            item: mediaStatus.media
        });
        loadNextMediaItem();
    }

    /**
     * Handler for JW Player setupErrors.
     * @param  {Object} setupError The setupError to handle.
     */
    function handleSetupError(setupError) {
        console.error('Failed to initialize player: %O', setupError);
        broadcastMessage({
            type: MessageType.LOAD_FAILED,
            requestId: currentRequestId ? currentRequestId : 0
        });
        currentRequestId = 0;
        mediaStatus.playerState = PlayerState.IDLE;
        mediaStatus.idleReason = IdleReason.ERROR;
        broadcastStatus();
    }

    /**
     * Handler for JW Player mediaErrors.
     */
    function handleMediaError(error) {
        let nextItem = getNextItemInQueue();
        let willAdvance = nextItem || mediaStatus.repeatMode == RepeatMode.REPEAT_ALL_AND_SHUFFLE
            && mediaStatus.items && mediaStatus.items.length > 2;

        events.publish(Events.MEDIA_ERROR, {
            error: error,
            currentItem: mediaStatus.media,
            nextItem: nextItem,
            willAdvance: willAdvance,
            timeout: ERROR_TIMEOUT
        });

        if (nextItem || willAdvance) {
            // Try to play the next item.
            window.setTimeout(() => {
                loadNextMediaItem();
            }, ERROR_TIMEOUT);
        }
    }

    /**
     * Handler for JW Player on('time') updates.
     */
    function handleTime(event) {
        // Update the UI
        events.publish(Events.MEDIA_TIME, {
            currentTime: event.position,
            duration: event.duration
        });
        if (mediaStatus) {
            mediaStatus.currentTime = event.position;

            let broadcastStatusUpdate = false;
            if (mediaStatus.media.duration != event.duration) {
                // Check if we need to broadcast a status
                // update for a playing event, if this is
                // the first time we figure out a duration.
                broadcastStatusUpdate = true;
                let media = mediaStatus.media;
                media.duration = event.duration;

                // Update mediaStatus.breaks with breaks that require
                // the duration to be known (e.g. postrolls & ads with a percentual offset).
                if (media.customData && media.customData.advertising
                    && media.customData.advertising.schedule) {
                    let adBreaks = mediaStatus.media.breaks || [];
                    let adSchedule = media.customData.advertising.schedule;
                    Object.keys(adSchedule).forEach(breakId => {
                        let adBreak = adSchedule[breakId];
                        if (adBreak.offset.indexOf('%') !== -1
                        && adBreak.offset !== 'post') {
                            return;
                        }
                        let adPosition = adBreak.offset === 'post' ?
                        media.duration : offsetTime(adBreak.offset, media.duration);
                        adBreaks.push(new AdBreakInfo(breakId, adPosition));
                    });
                    mediaStatus.media.breaks = adBreaks;
                }
            }
            // TODO: live stream support - chromecast does not
            // expect jwplayer's definition of position for the
            // currentTime of live streams.
            if (broadcastStatusUpdate) {
                broadcastStatus();
            }
        }
    }

    /**
     * Handler for JW Player on('captionList') events.
     */
    function handleCaptions(captionListEvent) {
        let tracksChanged = false;
        mediaStatus.media.tracks = mediaStatus.media.tracks || [];

        // Update mediaStatus.media.tracks/activeTrackIds and send status if applicable.
        captionListEvent.tracks.forEach((captionTrack, trackIndex) => {
            if (trackIndex == 0) {
            // trackIndex 0 is always off.
                return;
            }

            let newTrack = mediaStatus.media.tracks.length == 0
            || !mediaStatus.media.tracks.some(track => track.type == TrackType.TEXT
            && track.trackContentId == captionTrack.id);

            if (newTrack) {
            // Build a new cast.receiver.media.Track object, add it to mediaStatus.media.tracks.
                mediaStatus.media.tracks.push({
                    name: captionTrack.label,
                    trackContentId: captionTrack.id,
                    trackId: generateTrackId(),
                    type: TrackType.TEXT,
                    subtype: TextTrackType.CAPTIONS // TODO: distinguish between CC and SUBTITLES
                });
                tracksChanged = true;
            }
        });

        if (captionListEvent.track == 0 && !tracksChanged) {
            // If the caption track is disabled, make sure
            // that we update the array of activeTrackIds.
            tracksChanged = updateActiveTracks();
        }

        if (tracksChanged) {
            broadcastStatus();
        }
    }

    /**
     * Handler for JW Player on('audioTrack') events.
     */
    function handleAudioTracks(event) {
        let tracksChanged = false;
        mediaStatus.media.tracks = mediaStatus.media.tracks || [];

        event.tracks.forEach((audioTrack, index) => {
            let newTrack = mediaStatus.media.tracks.length == 0
                || !mediaStatus.media.tracks.some(track => track.type == TrackType.AUDIO
                && track.trackContentId == index);

            if (newTrack) {
                mediaStatus.media.tracks.push({
                    name: audioTrack.name,
                    trackContentId: index,
                    type: TrackType.AUDIO,
                    trackId: generateTrackId()
                });
                tracksChanged = true;
            }
        });

        if (tracksChanged) {
            updateActiveTracks();
            broadcastStatus();
        }
    }

    /**
     * Handler for the JW Player on('adImpression') events.
     * Used for IMA only.
     */
    function handleAdImpression(event) {
        let ima = event.ima;
        if (!ima) {
            return;
        }

        // Since IMA does not expose the on('adMeta') event,
        // we'll build an adMeta object and then trigger the adMeta handler.
        let adMeta = new AdMeta();

        // Copy the keys that are in both adMeta and event
        // to adMeta.
        Object.keys(adMeta).forEach(key => {
            if (event[key] !== undefined) {
                adMeta[key] = event[key];
            }
        });
        adMeta.title = event.adtitle;

        let ad = ima.ad;

        // Find the clickThroughUrl using this 'hack' in the ad object.
        Object.keys(ad).some(key => {
            if (ad[key].clickThroughUrl !== undefined) {
                adMeta.clickthrough = ad[key].clickThroughUrl;
                return true;
            }
        });

        let adPodInfo = ad.getAdPodInfo();
        if (adPodInfo) {
            adMeta.sequence = adPodInfo.getAdPosition();
            adMeta.podcount = adPodInfo.getTotalAds();
        }

        let adSelectionSettings = new google.ima.CompanionAdSelectionSettings();
        adSelectionSettings.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.IGNORE;
        adMeta.companions = AdCompanion.convertImaCompanions(ad.getCompanionAds(300, 250, adSelectionSettings));

        // Forward the meta object to the adMeta handler.
        handleAdMeta(adMeta);
    }

    /**
     * Handler for JW Player on('adMeta') events.
     */
    function handleAdMeta(event) {
        events.publish(Events.AD_IMPRESSION, {
            meta: event
        });
        let customData = mediaStatus.customData;
        customData.adMeta = event;
        // Force playerState to playing.
        mediaStatus.playerState = PlayerState.PLAYING;

        if (!event.sequence || event.sequence == 1) {
            // This is the first ad in a pod.
            adPodStartTime = Date.now();
        }

        // Populate mediaStatus.media.breaks and mediaStatus.media.breakClips.
        let adSchedule = playerInstance.getPlaylist()[playerInstance.getPlaylistIndex()].adschedule;
        if (adSchedule) {
            let breaks = mediaStatus.media.breaks;
            if (!breaks) {
                // We are dealing with a preroll, the duration of the media is unknown
                // and because of that the breaks have not yet been initialized.
                // We initialize an array of breaks, but we do not add the breaks
                // that require the duration to be known.
                breaks = [];
                let schedule = mediaStatus.media.customData.advertising.schedule;
                Object.keys(schedule).forEach(breakId => {
                    let adBreak = schedule[breakId];
                    if (adBreak.offset.indexOf('%') != -1
                    || adBreak.offset === 'post') {
                        return;
                    }

                    let breakPosition;
                    if (adBreak.offset == 'pre') {
                        breakPosition = 0;
                    } else {
                        breakPosition = adBreak.offset.indexOf(':') != -1 ?
                        jwplayer.utils.seconds(adBreak.offset) : Number.parseFloat(adBreak.offset);
                    }
                    breaks.push(new AdBreakInfo(breakId, breakPosition));
                    mediaStatus.media.breaks = breaks;
                });
            }

            let breakClips = mediaStatus.media.breakClips || [];

            // First find the "id" of the current ad break.
            let currentBreakId = null;
            Object.keys(adSchedule).some(breakId => {
                if (adSchedule[breakId].tag == event.tag) {
                    currentBreakId = breakId;
                    return true;
                }
            });

            // Next find the break by "id" in the current "breaks" array.
            let currentBreak = null;
            breaks.some((adBreak) => {
                if (adBreak.id == currentBreakId) {
                    currentBreak = adBreak;
                    return true;
                }
            });

            // Okay, now we should have all the ingredients to build
            // an adBreakClipInfo which we can associate to a "break".
            let adBreakClipInfo = new AdBreakClipInfo(event.id);
            adBreakClipInfo.clickThroughUrl = event.clickthrough;
            adBreakClipInfo.title = event.title;
            adBreakClipInfo.mimeType = event.creativetype;

            // Update the media status.
            breakClips.push(adBreakClipInfo);
            mediaStatus.media.breakClips = breakClips;

            let breakClipIds = currentBreak.breakClipIds || [];
            breakClipIds.push(adBreakClipInfo.id);
            currentBreak.breakClipIds = breakClipIds;

            // Now update the breakStatus
            let adBreakStatus = new AdBreakStatus(0.0, 0.0);
            adBreakStatus.breakId = currentBreakId;
            adBreakStatus.breakClipId = adBreakClipInfo.id;
            adBreakStatus.whenSkippable = event.skipoffset ? event.skipoffset : -1;
            mediaStatus.breakStatus = adBreakStatus;
        }

        broadcastStatus();
    }

    /**
     * Handler for the JW Player on('adTime') event.
     */
    function handleAdTime(event) {
        events.publish(Events.AD_TIME, event);
        if (mediaStatus.breakStatus) {
            let adBreakStatus = mediaStatus.breakStatus;
            adBreakStatus.currentBreakClipTime = event.position;
            adBreakStatus.currentBreakTime = (Date.now() - adPodStartTime) / 1000;

            // Update the ad duration.
            // TODO: prevent look-up of the adBreak in mediaStatus.media.breaks for
            // every time update?
            mediaStatus.media.breakClips.some(breakClip => {
                if (breakClip.id === adBreakStatus.breakClipId) {
                    breakClip.duration = event.duration;
                    return true;
                }
            });
            // TODO: update duration of the current ad break?
        }
    }

    /**
     * Handler for the JW Player on('adComplete') event.
     */
    function handleAdComplete(event) {
        events.publish(Events.AD_COMPLETE, event);
        let customData = mediaStatus.customData;
        delete customData.adMeta;

        // Update the isWatched property if necessary.
        mediaStatus.media.breaks.some(adBreak => {
            if (adBreak.breakClipIds
        && adBreak.breakClipIds.indexOf(event.id) != -1) {
                adBreak.isWatched = true;
                return true;
            }
        });

        delete mediaStatus.breakStatus;
        broadcastStatus();
    }

    /*
     * Utility functions.
     */

    /**
     * Loads an item on JW Player.
     * @param {MediaInfo} the item to load, this can be a MediaQueue item, or a media item.
     */
    function loadItem(item) {
        return new Promise((resolve, reject) => {
            // Broadcast a MEDIA_LOAD event.
            events.publish(Events.MEDIA_LOAD, {
                item: item
            });

            if (!playerInstance) {
                playerInstance = jwplayer(container);
            }

            let media = item.media ? item.media : item;
            let playlist = mediaToPlaylist(media);
            let playerConfig = {
                primary: 'html5',
                width: '100%',
                height: '100%',
                playlist: playlist,
                hlshtml: true,
                autostart: item.autoplay ? item.autoplay : true,
                controls: false,
                analytics: analyticsConfig,
            };

            let customMediaData = media.customData || {};

            if (customMediaData.advertising && customMediaData.advertising.client) {
                playerConfig.advertising = {
                    client: customMediaData.advertising.client
                };
            }
            if (customMediaData.drm) {
                playerConfig.drm = customMediaData.drm;
            }

            // TODO: set textTrackStyle.
            // if (playerInstance.getConfig()) {
            //   playerInstance.stop();
            // }
            playerInstance.setup(playerConfig);

            mediaStatus.currentTime = 0;
            if ((item.startTimeOverride || item.startTime) && item.streamType != 'LIVE') {
                // TODO: Check for live.
                let startTime = item.startTimeOverride ? item.startTimeOverride : item.startTime;

                mediaStatus.currentTime = startTime;
                playerInstance.once('ready', function() {
                    playerInstance.seek(startTime);
                });

                // The startTime can only be overridden once.
                delete item.startTimeOverride;
            }

            mediaStatus.playerState = (item.autoplay || item.autoplay === undefined)
            ? PlayerState.BUFFERING : PlayerState.PAUSED;
            mediaStatus.media = media;
            mediaStatus.activeTrackIds = [];
            // TODO:
            // Chrome senders might have issues if they receive a status
            // update with a media.duration of 0 when the player state is set to
            // playing.
            mediaStatus.media.duration = mediaStatus.media.duration || 0;

            // Ensure new media metadata gets pushed to
            // the senders.
            // mediaStatusFlags.push(MediaStatusFlags.META);

            // Update the currentItemId.
            if (item.itemId) {
                mediaStatus.currentItemId = item.itemId;
            } else {
                delete mediaStatus.currentItemId;
            }

            registerPlayerStateListeners();

            playerInstance.once('setupError', reject);
            playerInstance.once('error', reject);
            if (mediaStatus.media.duration) {
                // Update ad break info before resolving.
                initAdBreakInfo(media);
            }

            let hasPreRoll = mediaStatus.media.breaks
            && mediaStatus.media.breaks.some(adBreak => {
                return adBreak.position === 0;
            });

            if (hasPreRoll && !mediaStatus.media.duration) {
                // It is impossible to determine the duration
                // before playback.
                resolve();
            } else {
                // Listen for the 'meta' event in order the duration
                // before playback begins.
                const onDuration = event => {
                    console.log('onDuration');
                    if (event.duration >= 0) {
                        playerInstance.off('meta time', onDuration);
                        mediaStatus.media.duration = event.duration;
                        resolve();
                    }
                };
                playerInstance.on('meta time', onDuration);
            }
        });
    }

    function loadNextMediaItem() {
        let index;
        let n;
        let temp;
        let i;

        if (mediaStatus) {
            switch (mediaStatus.repeatMode) {
                case RepeatMode.REPEAT_OFF:
                    // Remove the current item from mediaSession/queue.
                    // Load next item on player and play.
                    if (mediaStatus.items) {
                        // Pop the current item of the queue.
                        mediaStatus.items.shift();
                        // If there is a next item in the queue, play it.
                        if (mediaStatus.items.length != 0) {
                            loadItem(mediaStatus.items[0]).catch(handleSetupError);
                        } else {
                            mediaStatus.idleReason = IdleReason.FINISHED;
                        }
                        // Make sure to push the updated queue to connected
                        // senders.
                        // mediaStatusFlags.push(MediaStatusFlags.QUEUE);
                    }
                    break;
                case RepeatMode.REPEAT_ALL:
                    index = getCurrentQueueIndex();
                    if (index) {
                        if (index < mediaStatus.items.length - 1) {
                            // Play the next item.
                            loadItem(mediaStatus.items[index++]).catch(handleSetupError);
                        } else {
                            // Recycle through the queue.
                            loadItem(mediaStatus.items[0]).catch(handleSetupError);
                        }
                    }
                    break;
                case RepeatMode.REPEAT_SINGLE:
                    // Seek to the beginning.
                    playerInstance.seek(0);
                    // Restart playback.
                    playerInstance.play(true);
                    break;
                case RepeatMode.REPEAT_ALL_AND_SHUFFLE:
                    index = getCurrentQueueIndex();
                    if (index) {
                        if (index < mediaStatus.items.length - 1) {
                            loadItem(mediaStatus.items[index++]).catch(handleSetupError);
                        } else {
                            // Shuffle time!
                            n = mediaStatus.items.length;

                            // Shuffle the queue using Fisher-Yates (O(n)):
                            while (n) {
                                // Pick a remaining element.
                                i = Math.floor(Math.random() * n--);

                                // Swap it with the current element.
                                temp = mediaStatus.items[n];
                                mediaStatus.items[n] = mediaStatus.items[i];
                                mediaStatus.items[i] = temp;
                            }

                            // Play the first item.
                            loadItem(mediaStatus.items[0]).catch(handleSetupError);

                            // Make sure to push the updated queue to connected
                            // senders.
                            // mediaStatusFlags.push(MediaStatusFlags.QUEUE);
                        }
                    }
                    break;
                default:
                    // Do nothing.
                    break;
            }
        }
    }

    function updatePlayerState(newState, adPlaying) {
        if (mediaStatus) {
            let newPlayerState;
            switch (newState) {
                case 'buffer':
                    newPlayerState = PlayerState.BUFFERING;
                    break;
                case 'idle':
                    newPlayerState = PlayerState.IDLE;
                    break;
                case 'pause':
                    newPlayerState = PlayerState.PAUSED;
                    break;
                case 'play':
                    newPlayerState = PlayerState.PLAYING;
                    break;
                default:
                    break;
            }
            let oldState = mediaStatus.playerState;
            mediaStatus.playerState = newPlayerState;
            if (!adPlaying) {
                events.publish(Events.STATE_CHANGE, {
                    oldState: oldState,
                    newState: mediaStatus.playerState
                });
            }
            broadcastStatus();
        }
    }

    function registerPlayerStateListeners() {
        playerInstance.on('buffer', () => {
            updatePlayerState('buffer', false);
        });
        playerInstance.on('idle', () => {
            updatePlayerState('idle', false);
        });
        playerInstance.on('pause', () => {
            updatePlayerState('pause', false);
        });
        playerInstance.on('play', () => {
            updatePlayerState('play', false);
        });
        playerInstance.on('time', handleTime);
        playerInstance.on('error', handleMediaError);
        playerInstance.on('mediaError', handleMediaError);
        playerInstance.on('complete', handleComplete);
        playerInstance.on('captionsList', handleCaptions);
        playerInstance.on('audioTracks', handleAudioTracks);
        playerInstance.on('playlistItem', (playlistItem) => {
            events.publish(Events.MEDIA_LOADED, {
                media: mediaStatus.media,
                playlistItem: playlistItem
            });
        });
        playerInstance.on('seek', event => events.publish(Events.MEDIA_SEEK, event));
        playerInstance.on('seeked', () => {
            events.publish(Events.MEDIA_SEEKED, {});
        });
        // googima doesn't fire adMeta events, thus we use the adImpression event
        // to trigger the handler.
        if (mediaStatus.media.customData
            && mediaStatus.media.customData.advertising) {
            let advertising = mediaStatus.media.customData.advertising;
            if (advertising.client === 'vast') {
                playerInstance.on('adMeta', handleAdMeta);
            } else if (advertising.client === 'googima') {
                playerInstance.on('adImpression', handleAdImpression);
            }
        }
        playerInstance.on('adPlay', event => {
            updatePlayerState('play', true);
            events.publish(Events.AD_PLAY, event);
        });
        playerInstance.on('adPause', event => {
            updatePlayerState('pause', true);
            events.publish(Events.AD_PAUSE, event);
        });
        playerInstance.on('adComplete', handleAdComplete);
        playerInstance.on('adError', event => {
            console.error('AdError: %O', event);
            events.publish(Events.AD_ERROR, event);
            delete mediaStatus.customData.adMeta;
            delete mediaStatus.breakStatus;
            broadcastStatus();
        });
        playerInstance.on('adTime', handleAdTime);
    }

    function removeStateListeners() {
        playerInstance.off('buffer');
        playerInstance.off('idle');
        playerInstance.off('pause');
        playerInstance.off('play');
        playerInstance.off('time');
        playerInstance.off('error');
        playerInstance.off('mediaError');
        playerInstance.off('complete');
        playerInstance.off('captionsList');
        playerInstance.off('audioTracks');
        playerInstance.off('adMeta');
        playerInstance.off('adComplete');
        playerInstance.off('adError');
        playerInstance.off('adImpression');
    }

    function serializeStatus(requestId) {
        updateActiveTracks();

        let statusCopy;
        if (mediaStatus) {
            statusCopy = Object.assign({}, mediaStatus);

            // Delete properties we don't want to send.
            // for (let flag in MediaStatusFlags) {
            //   if (MediaStatusFlags.hasOwnProperty(flag)
            //     && mediaStatusFlags.indexOf(flag) < 0) {
            //     delete statusCopy[MediaStatusFlags[flag]];
            //     mediaStatusFlags.splice(mediaStatusFlags.indexOf(flag), 1);
            //   }
            // }

            if (!statusCopy.activeTrackIds) {
                delete statusCopy.activeTrackIds;
            }
        }

        let status = {
            type: MessageType.MEDIA_STATUS,
            requestId: requestId ? requestId : currentRequestId,
            status: statusCopy ? [statusCopy] : []
        };
        // Always reset the requestId after a message has been sent with it.
        currentRequestId = 0;
        return status;
    }

    function broadcastStatus(requestId) {
        if (isLoading) {
            return;
        }
        broadcastMessage(serializeStatus(requestId));
    }

    function sendStatus(senderId, requestId) {
        if (isLoading) {
            return;
        }
        let status = serializeStatus(requestId);
        sendMessage(senderId, status);
    }

    function sendErrorInvalidRequest(event, reason) {
        sendError(MessageType.INVALID_REQUEST, reason, event);
    }

    function sendErrorInvalidPlayerState(event) {
        broadcastMessage({
            requestId: event.requestId ? event.requestId : 0,
            type: MessageType.INVALID_PLAYER_STATE,
        });
    }

    function sendErrorLoadCancelled(event) {
        broadcastMessage({
            requestId: event.requestId ? event.requestId : 0,
            type: MessageType.LOAD_CANCELLED
        });
    }

    function sendError(messageType, reason, event) {
        broadcastMessage({
            requestId: event.requestId ? event.requestId : 0,
            type: messageType,
            reason: reason
        });
    }

    /**
     * Creates a new mediaSession, destroying an existing one if it exists.
     */
    function createMediaSession() {
        if (playerInstance) {
            playerInstance.stop();
            removeStateListeners();
        }

        let mediaSessionId = mediaStatus ? mediaStatus.mediaSessionId += 1 : 1;
        mediaStatus = new cast.receiver.media.MediaStatus();
        mediaStatus.activeTrackIds = [];
        mediaStatus.supportedMediaCommands = SUPPORTED_FEATURES;
        mediaStatus.mediaSessionId = mediaSessionId;
        mediaStatus.customData = {};
    }

    function getCurrentQueueIndex() {
        return findIndexOfItem(mediaStatus.currentItemId);
    }

    function findIndexOfItem(itemId) {
        let itemIndex = -1;
        if (!itemId || !mediaStatus.items
            || mediaStatus.items.length == 0) {
            return itemIndex;
        }

        mediaStatus.items.some((mediaItem, index) => {
            if (itemId == mediaItem.itemId) {
                itemIndex = index;
                return true;
            }
        });
        return itemIndex;
    }

    function getTrackIndex(trackId) {
        let trackIndex = -1;
        if (!trackId || !mediaStatus.media.tracks
            || mediaStatus.media.tracks.length == 0) {
            return trackIndex;
        }

        mediaStatus.media.tracks.some((track, index) => {
            if (trackId == track.trackId) {
                trackIndex = index;
                return true;
            }
            return false;
        });
        return trackIndex;
    }

    function getTrackById(trackId) {
        let trackIndex = getTrackIndex(trackId);
        if (trackIndex < 0) {
            return null;
        }
        return mediaStatus.media.tracks[trackIndex];
    }

    // Converts a Chromecast Media Object into a JW Player playlist.
    function mediaToPlaylist(media) {
        let playlistItem = {
            file: media.contentId,
            tracks: []
        };
        if (media.customData) {
            let customData = media.customData;

            if (customData.mediaid) {
                playlistItem.mediaid = customData.mediaid;
            }
            if (customData.advertising && customData.advertising.schedule) {
                playlistItem.adschedule = customData.advertising.schedule;
            }
            if (customData.drm) {
                playlistItem.drm = customData.drm;
            }
        }
        if (media.tracks) {
            // Set side car caption tracks.
            media.tracks.forEach(function(track) {
                if (track.type === TrackType.TEXT
                    && track.trackContentId) {
                    // Note: JW Player textTrack!
                    let textTrack = {
                        file: track.trackContentId,
                        label: track.name
                    };
                    if (!track.subtype ||
                        track.subtype == TextTrackType.SUBTITLES
                        || track.subtype == TextTrackType.CAPTIONS) {
                        textTrack.kind = 'captions';
                    } else if (track.subtype == TextTrackType.CHAPTERS) {
                        textTrack.kind = 'chapters';
                    } else {
                        // Track is TextTrackType.METADATA, or TextTrackType.DESCRIPTIONS.
                        // Unsupported currently.
                        return;
                    }
                    playlistItem.tracks.push(textTrack);
                }
            });
        }
        return [playlistItem];
    }

    function offsetTime(offset, duration) {
        if (offset.toString().slice(-1) === '%') {
            return duration * Number.parseFloat(offset.slice(0, -1)) / 100;
        }
        return Number.parseFloat(offset);
    }

    // Parses Ad Breaks from the customData section of a MediaInfo object.
    function parseBreaksFromMediaInfo(media) {
        let adBreaks = [];
        if (!media.customData || !media.customData.advertising
            || !media.customData.advertising.schedule) {
            return adBreaks;
        }
        let adSchedule = media.customData.advertising.schedule;
        Object.keys(adSchedule).forEach(breakId => {
            let adBreak = adSchedule[breakId];
            let breakPosition;
            if (adBreak.offset == 'pre') {
                breakPosition = 0;
            } else if (adBreak.offset == 'post') {
                breakPosition = media.duration;
            } else {
                breakPosition = adBreak.offset.indexOf(':') != -1 ?
                jwplayer.utils.seconds(adBreak.offset) : offsetTime(adBreak.offset, media.duration);
            }
            adBreaks.push(new AdBreakInfo(breakId, breakPosition));
        });
        return adBreaks;
    }

    /**
     * Initializes the "breaks" property in a MediaInfo object.
     */
    function initAdBreakInfo(media) {
        // Update information about adBreaks in the MediaInfo object.
        let breaks = parseBreaksFromMediaInfo(media);
        if (breaks.length > 0) {
            media.breaks = breaks;
        } else {
            delete media.breaks;
        }
        // Delete breakClips until we have determined them.
        delete media.breakClips;
    }

    /**
     * Generates a new unique trackId.
     */
    function generateTrackId() {
        let trackId = 1;
        // Find the highest trackId in mediaStatus.media.tracks and start numbering from that.
        mediaStatus.media.tracks.forEach(track => {
            if (track.trackId >= trackId) {
                trackId = track.trackId++;
            }
        });
        return trackId;
    }

    /**
     * Synchronizes the activeTrackIds array in the media session with
     * what is active on the JW Player instance.
     */
    function updateActiveTracks() {
        if (!mediaStatus) {
            // No active media session.
            return false;
        }

        let activeTrackIds = [];
        if (!playerInstance) {
            mediaStatus.activeTrackIds = activeTrackIds;
            return false;
        }

        // Caption Tracks
        let activeCaptionTrackIndex = playerInstance.getCurrentCaptions();
        if (activeCaptionTrackIndex > 0) {
            // Player has captions enabled.
            let activeCaptionTrack = playerInstance.getCaptionsList()[activeCaptionTrackIndex];
            // Find the associated track in mediaStatus.media.tracks:
            mediaStatus.media.tracks.some(track => {
                if (track.type == TrackType.TEXT
            && track.trackContentId == activeCaptionTrack.id) {
                    activeTrackIds.push(track.trackId);
                    return true;
                }
            });
        }

        // Audio Tracks
        let activeAudioTrack = playerInstance.getCurrentAudioTrack();
        // -1 = no alternative tracks
        if (activeAudioTrack >= 0) {
            mediaStatus.media.tracks.some(track => {
                if (track.type == TrackType.AUDIO
            && track.trackContentId == activeAudioTrack) {
                    activeTrackIds.push(track.trackId);
                    return true;
                }
            });
        }

        // TODO: Video Tracks

        // Check whether the activeTracks were updated.
        let activeTracksChanged = mediaStatus.activeTrackIds.length != activeTrackIds.length
            || mediaStatus.activeTrackIds.some(trackId => activeTrackIds.indexOf(trackId) < 0);
        // Update the media session.
        mediaStatus.activeTrackIds = activeTrackIds;
        return activeTracksChanged;
    }

    /**
     * Returns the next item in the queue.
     */
    function getNextItemInQueue() {
        let index = -1;

        // TODO: can we get rid of the duplicated logic here?
        // maybe merge with handleComplete?
        // Is there a better way of exposing this?
        switch (mediaStatus.repeatMode) {
            case RepeatMode.REPEAT_OFF:
                return mediaStatus.items.length >= 2 ? mediaStatus.items[1] : null;
            case RepeatMode.REPEAT_ALL:
                index = getCurrentQueueIndex();
                if (index != -1) {
                    return index == mediaStatus.items.length - 1
                        ? mediaStatus.items[0] : mediaStatus.items[index++];
                }
                return null;
            case RepeatMode.REPEAT_SINGLE:
                return mediaStatus.items[getCurrentQueueIndex()];
            case RepeatMode.REPEAT_ALL_AND_SHUFFLE:
                index = getCurrentQueueIndex();
                if (index != -1) {
                    return index == mediaStatus.items.length - 1
                        ? null : mediaStatus.items[index++];
                }
                break;
            default:
                break;
        }
        return null;
    }

    return {
        /**
         * Returns the next item in the queue.
         */
        getNextItemInQueue: getNextItemInQueue,

        /**
         * Returns the repeatMode, or null if there is no active mediaSession.
         */
        getRepeatMode: function() {
            return mediaStatus.repeatMode;
        },

        /**
         * Adds an item to the queue.
         */
        addItemToQueue: function(mediaQueueItem) {
            onQueueInsert({
                data: {
                    items: [mediaQueueItem]
                }
            });
        }
    };
}
